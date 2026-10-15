#define _POSIX_C_SOURCE 200809L

#include <ctype.h>
#include <dirent.h>
#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>
#include <sys/wait.h>
#include <unistd.h>

#define OPKG_CONF_DIR "/etc/opkg"
#define OPKG_LISTS_DIR "/data/pkg-state/opkg/lists"
#define APPS_ROOT "/data/onekvm/apps"
#define HOST_CLI "/usr/bin/onekvm-extension"
#define FEED_CUSTOM_PREFIX "onekvm-ext-"
#define FEED_CUSTOM_SUFFIX ".conf"
#define FEED_DISABLED_SUFFIX ".disabled"
#define SYSTEM_FEED_NAME "onekvm"
#define SYSTEM_FEED_PATH "/etc/opkg/onekvm-feed.conf"
#define MAX_FEED_BYTES (16 * 1024)
#define MAX_NAME_LEN 63
#define MAX_DISPLAY_NAME 64
#define MAX_DISPLAY_BYTES 192
#define SOURCE_KEY_PREFIX "# OneKVM-Source-Key:"
#define SOURCE_NAME_PREFIX "# OneKVM-Source-Name:"
#define MAX_FIELD 8192
#define HOST_ID "plugin-marketplace"

static int valid_source_name(const char *name) {
	size_t length = strlen(name);
	if (length == 0 || length > MAX_NAME_LEN) {
		return 0;
	}
	if (!((name[0] >= 'a' && name[0] <= 'z') || (name[0] >= '0' && name[0] <= '9'))) {
		return 0;
	}
	for (size_t index = 1; index < length; index++) {
		char byte = name[index];
		if (!((byte >= 'a' && byte <= 'z') || (byte >= '0' && byte <= '9') || byte == '-')) {
			return 0;
		}
	}
	return 1;
}

static int valid_extension_id(const char *name) {
	return valid_source_name(name);
}

static int custom_config_path(const char *name, char *out, size_t out_size) {
	if (!valid_source_name(name)) {
		fprintf(stderr, "invalid source key\n");
		return 1;
	}
	int written = snprintf(out, out_size, "%s/%s%s%s", OPKG_CONF_DIR, FEED_CUSTOM_PREFIX, name, FEED_CUSTOM_SUFFIX);
	if (written < 0 || (size_t)written >= out_size) {
		fprintf(stderr, "source path too long\n");
		return 1;
	}
	return 0;
}

static int append_disabled_suffix(const char *path, char *out, size_t out_size) {
	int written = snprintf(out, out_size, "%s%s", path, FEED_DISABLED_SUFFIX);
	if (written < 0 || (size_t)written >= out_size) {
		fprintf(stderr, "source path too long\n");
		return 1;
	}
	return 0;
}

static int file_is_regular(const char *path) {
	struct stat st;
	return stat(path, &st) == 0 && S_ISREG(st.st_mode);
}

static int unlink_if_exists(const char *path) {
	if (unlink(path) == 0 || errno == ENOENT) {
		return 0;
	}
	fprintf(stderr, "unlink %s: %s\n", path, strerror(errno));
	return 1;
}

static int set_path_enabled(const char *active, int enabled) {
	char disabled[512];
	if (append_disabled_suffix(active, disabled, sizeof(disabled)) != 0) {
		return 1;
	}
	if (enabled) {
		if (file_is_regular(active)) {
			return unlink_if_exists(disabled);
		}
		if (!file_is_regular(disabled)) {
			fprintf(stderr, "package source is missing\n");
			return 1;
		}
		if (rename(disabled, active) != 0) {
			fprintf(stderr, "enable %s: %s\n", active, strerror(errno));
			return 1;
		}
		return 0;
	}
	if (file_is_regular(disabled) && !file_is_regular(active)) {
		return 0;
	}
	if (!file_is_regular(active)) {
		fprintf(stderr, "package source is missing\n");
		return 1;
	}
	if (unlink_if_exists(disabled) != 0) {
		return 1;
	}
	if (rename(active, disabled) != 0) {
		fprintf(stderr, "disable %s: %s\n", active, strerror(errno));
		return 1;
	}
	return 0;
}

static int custom_stem(const char *file_name, char *stem, size_t stem_size) {
	size_t prefix_len = strlen(FEED_CUSTOM_PREFIX);
	size_t suffix_len = strlen(FEED_CUSTOM_SUFFIX);
	size_t disabled_len = suffix_len + strlen(FEED_DISABLED_SUFFIX);
	size_t name_len = strlen(file_name);
	size_t stem_len;
	if (name_len <= prefix_len || strncmp(file_name, FEED_CUSTOM_PREFIX, prefix_len) != 0) {
		return 0;
	}
	if (name_len > prefix_len + disabled_len &&
	    strcmp(file_name + name_len - disabled_len, FEED_CUSTOM_SUFFIX FEED_DISABLED_SUFFIX) == 0) {
		stem_len = name_len - prefix_len - disabled_len;
	} else if (name_len > prefix_len + suffix_len &&
	           strcmp(file_name + name_len - suffix_len, FEED_CUSTOM_SUFFIX) == 0) {
		stem_len = name_len - prefix_len - suffix_len;
	} else {
		return 0;
	}
	if (stem_len == 0 || stem_len >= stem_size || stem_len > MAX_NAME_LEN) {
		return 0;
	}
	memcpy(stem, file_name + prefix_len, stem_len);
	stem[stem_len] = '\0';
	return valid_source_name(stem);
}

static void trim_inplace(char *value) {
	char *start = value;
	size_t length;
	while (*start && isspace((unsigned char)*start)) {
		start++;
	}
	if (start != value) {
		memmove(value, start, strlen(start) + 1);
	}
	length = strlen(value);
	while (length > 0 && isspace((unsigned char)value[length - 1])) {
		value[--length] = '\0';
	}
}

static int valid_display_name(const char *name) {
	size_t chars = 0;
	const unsigned char *cursor;
	if (!name || name[0] == '\0' || strlen(name) > MAX_DISPLAY_BYTES) {
		return 0;
	}
	cursor = (const unsigned char *)name;
	while (*cursor) {
		if (*cursor == '\n' || *cursor == '\r') {
			return 0;
		}
		if (*cursor < 0x80) {
			cursor++;
		} else if ((cursor[0] & 0xE0) == 0xC0 && (cursor[1] & 0xC0) == 0x80) {
			cursor += 2;
		} else if ((cursor[0] & 0xF0) == 0xE0 && (cursor[1] & 0xC0) == 0x80 && (cursor[2] & 0xC0) == 0x80) {
			cursor += 3;
		} else if ((cursor[0] & 0xF8) == 0xF0 && (cursor[1] & 0xC0) == 0x80 && (cursor[2] & 0xC0) == 0x80 && (cursor[3] & 0xC0) == 0x80) {
			cursor += 4;
		} else {
			return 0;
		}
		chars++;
		if (chars > MAX_DISPLAY_NAME) {
			return 0;
		}
	}
	return chars > 0;
}

static int line_has_prefix(const char *line, const char *prefix) {
	while (*line == ' ' || *line == '\t') {
		line++;
	}
	return strncmp(line, prefix, strlen(prefix)) == 0;
}

static void copy_header_value(const char *line, const char *prefix, char *out, size_t out_size) {
	size_t length;
	while (*line == ' ' || *line == '\t') {
		line++;
	}
	line += strlen(prefix);
	while (*line == ' ' || *line == '\t') {
		line++;
	}
	length = strcspn(line, "\r\n");
	while (length > 0 && (line[length - 1] == ' ' || line[length - 1] == '\t')) {
		length--;
	}
	if (length >= out_size) {
		length = out_size - 1;
	}
	memcpy(out, line, length);
	out[length] = '\0';
}

static void strip_source_headers(char *text, size_t *length, char *display, size_t display_size) {
	char rest[MAX_FEED_BYTES + 1];
	size_t rest_len = 0;
	int in_header = 1;
	const char *cursor = text;
	if (display_size > 0) {
		display[0] = '\0';
	}
	while (*cursor) {
		const char *newline = strchr(cursor, '\n');
		size_t line_len = newline ? (size_t)(newline - cursor) : strlen(cursor);
		if (in_header) {
			char line[512];
			size_t copy = line_len < sizeof(line) - 1 ? line_len : sizeof(line) - 1;
			char *start;
			memcpy(line, cursor, copy);
			line[copy] = '\0';
			start = line;
			while (*start == ' ' || *start == '\t') {
				start++;
			}
			if (line_has_prefix(start, SOURCE_KEY_PREFIX)) {
				cursor = newline ? newline + 1 : cursor + line_len;
				continue;
			}
			if (line_has_prefix(start, SOURCE_NAME_PREFIX)) {
				copy_header_value(start, SOURCE_NAME_PREFIX, display, display_size);
				cursor = newline ? newline + 1 : cursor + line_len;
				continue;
			}
			if (*start == '\0' || *start == '\r') {
				cursor = newline ? newline + 1 : cursor + line_len;
				continue;
			}
			in_header = 0;
		}
		if (rest_len + line_len + (newline ? 1 : 0) >= sizeof(rest)) {
			break;
		}
		memcpy(rest + rest_len, cursor, line_len);
		rest_len += line_len;
		if (newline) {
			rest[rest_len++] = '\n';
			cursor = newline + 1;
		} else {
			cursor += line_len;
		}
	}
	rest[rest_len] = '\0';
	memcpy(text, rest, rest_len + 1);
	*length = rest_len;
}

static int compose_source_file(
	const char *key,
	const char *name,
	const char *feeds,
	char *out,
	size_t out_size,
	size_t *length_out
) {
	int written = snprintf(
		out,
		out_size,
		"%s %s\n%s %s\n%s",
		SOURCE_KEY_PREFIX,
		key,
		SOURCE_NAME_PREFIX,
		name,
		feeds
	);
	if (written < 0 || (size_t)written >= out_size) {
		fprintf(stderr, "feed configuration exceeds %d bytes\n", MAX_FEED_BYTES);
		return 1;
	}
	if (written == 0 || out[written - 1] != '\n') {
		if ((size_t)written + 1 >= out_size) {
			fprintf(stderr, "feed configuration exceeds %d bytes\n", MAX_FEED_BYTES);
			return 1;
		}
		out[written] = '\n';
		out[written + 1] = '\0';
		written++;
	}
	*length_out = (size_t)written;
	return 0;
}

static int push_unique_name(char ***names, size_t *count, size_t *capacity, const char *stem) {
	for (size_t index = 0; index < *count; index++) {
		if (strcmp((*names)[index], stem) == 0) {
			return 0;
		}
	}
	if (*count == *capacity) {
		size_t next = *capacity ? *capacity * 2 : 8;
		char **resized = realloc(*names, next * sizeof(**names));
		if (!resized) {
			fprintf(stderr, "out of memory\n");
			return 1;
		}
		*names = resized;
		*capacity = next;
	}
	(*names)[*count] = strdup(stem);
	if (!(*names)[*count]) {
		fprintf(stderr, "out of memory\n");
		return 1;
	}
	(*count)++;
	return 0;
}

static void json_escape_write(FILE *out, const char *text, size_t length) {
	fputc('"', out);
	for (size_t index = 0; index < length; index++) {
		unsigned char byte = (unsigned char)text[index];
		switch (byte) {
		case '\\':
		case '"':
			fputc('\\', out);
			fputc(byte, out);
			break;
		case '\n':
			fputs("\\n", out);
			break;
		case '\r':
			fputs("\\r", out);
			break;
		case '\t':
			fputs("\\t", out);
			break;
		default:
			if (byte < 0x20) {
				fprintf(out, "\\u%04x", byte);
			} else {
				fputc(byte, out);
			}
			break;
		}
	}
	fputc('"', out);
}

static int write_all(const char *path, const char *data, size_t length) {
	char temporary[sizeof(OPKG_CONF_DIR) + sizeof(FEED_CUSTOM_PREFIX) + MAX_NAME_LEN + sizeof(FEED_CUSTOM_SUFFIX) + 8];
	if (mkdir(OPKG_CONF_DIR, 0755) != 0 && errno != EEXIST) {
		fprintf(stderr, "mkdir %s: %s\n", OPKG_CONF_DIR, strerror(errno));
		return 1;
	}
	int written = snprintf(temporary, sizeof(temporary), "%s.tmp", path);
	if (written < 0 || (size_t)written >= sizeof(temporary)) {
		fprintf(stderr, "temporary path too long\n");
		return 1;
	}
	FILE *file = fopen(temporary, "w");
	if (!file) {
		fprintf(stderr, "open %s: %s\n", temporary, strerror(errno));
		return 1;
	}
	if (fwrite(data, 1, length, file) != length || fflush(file) != 0) {
		fprintf(stderr, "write %s: %s\n", temporary, strerror(errno));
		fclose(file);
		unlink(temporary);
		return 1;
	}
	if (fclose(file) != 0) {
		fprintf(stderr, "close %s: %s\n", temporary, strerror(errno));
		unlink(temporary);
		return 1;
	}
	if (rename(temporary, path) != 0) {
		fprintf(stderr, "rename %s: %s\n", path, strerror(errno));
		unlink(temporary);
		return 1;
	}
	return 0;
}

static int validate_feeds(const char *text) {
	const char *cursor = text;
	int saw_feed = 0;
	while (*cursor) {
		const char *line_end = strchr(cursor, '\n');
		size_t length = line_end ? (size_t)(line_end - cursor) : strlen(cursor);
		char line[512];
		if (length >= sizeof(line)) {
			fprintf(stderr, "feed line too long\n");
			return 1;
		}
		memcpy(line, cursor, length);
		line[length] = '\0';
		cursor = line_end ? line_end + 1 : cursor + length;

		char *start = line;
		while (*start && isspace((unsigned char)*start)) {
			start++;
		}
		if (*start == '\0' || *start == '#') {
			continue;
		}
		char kind[16];
		char name[128];
		char url[384];
		if (sscanf(start, "%15s %127s %383s", kind, name, url) != 3) {
			fprintf(stderr, "invalid feed line\n");
			return 1;
		}
		if (strcmp(kind, "src") != 0 && strcmp(kind, "src/gz") != 0) {
			fprintf(stderr, "feed kind must be src or src/gz\n");
			return 1;
		}
		if (strchr(name, '/') || strchr(name, '.') == name) {
			fprintf(stderr, "invalid feed name\n");
			return 1;
		}
		if (strncmp(url, "http://", 7) != 0 && strncmp(url, "https://", 8) != 0) {
			fprintf(stderr, "feed URL must be http(s)\n");
			return 1;
		}
		if (strchr(url, '@') || strchr(url, '?') || strchr(url, '#')) {
			fprintf(stderr, "feed URL contains forbidden characters\n");
			return 1;
		}
		char extra;
		if (sscanf(start, "%15s %127s %383s %c", kind, name, url, &extra) == 4) {
			fprintf(stderr, "feed line has trailing fields\n");
			return 1;
		}
		saw_feed = 1;
	}
	if (!saw_feed) {
		fprintf(stderr, "source must contain at least one src/gz line\n");
		return 1;
	}
	return 0;
}

static int read_file_text(const char *path, char *buffer, size_t capacity, size_t *length_out) {
	FILE *file = fopen(path, "r");
	if (!file) {
		return -1;
	}
	size_t length = fread(buffer, 1, capacity - 1, file);
	int read_error = ferror(file);
	fclose(file);
	if (read_error) {
		return -1;
	}
	buffer[length] = '\0';
	*length_out = length;
	return 0;
}

static int write_source_object(
	int *first,
	const char *key,
	const char *name,
	const char *path,
	const char *text,
	size_t length,
	int builtin,
	int enabled
) {
	if (!*first) {
		fputc(',', stdout);
	}
	*first = 0;
	fputs("{\"key\":", stdout);
	json_escape_write(stdout, key, strlen(key));
	fputs(",\"name\":", stdout);
	json_escape_write(stdout, name, strlen(name));
	fputs(",\"path\":", stdout);
	json_escape_write(stdout, path, strlen(path));
	fputs(",\"feeds_text\":", stdout);
	json_escape_write(stdout, text, length);
	fputs(",\"builtin\":", stdout);
	fputs(builtin ? "true" : "false", stdout);
	fputs(",\"enabled\":", stdout);
	fputs(enabled ? "true" : "false", stdout);
	fputc('}', stdout);
	return 0;
}

static int emit_source_from_paths(
	int *first,
	const char *name,
	const char *active,
	int builtin,
	char *buffer,
	size_t buffer_size
) {
	char disabled[512];
	char display[MAX_DISPLAY_BYTES + 1];
	size_t length = 0;
	if (read_file_text(active, buffer, buffer_size, &length) == 0) {
		if (builtin) {
			display[0] = '\0';
			return write_source_object(first, name, display, active, buffer, length, 1, 1);
		}
		snprintf(display, sizeof(display), "%s", name);
		strip_source_headers(buffer, &length, display, sizeof(display));
		if (display[0] == '\0') {
			snprintf(display, sizeof(display), "%s", name);
		}
		return write_source_object(first, name, display, active, buffer, length, 0, 1);
	}
	if (errno != ENOENT) {
		fprintf(stderr, "read %s: %s\n", active, strerror(errno));
		return 1;
	}
	if (append_disabled_suffix(active, disabled, sizeof(disabled)) != 0) {
		return 1;
	}
	if (read_file_text(disabled, buffer, buffer_size, &length) == 0) {
		if (builtin) {
			display[0] = '\0';
			return write_source_object(first, name, display, active, buffer, length, 1, 0);
		}
		snprintf(display, sizeof(display), "%s", name);
		strip_source_headers(buffer, &length, display, sizeof(display));
		if (display[0] == '\0') {
			snprintf(display, sizeof(display), "%s", name);
		}
		return write_source_object(first, name, display, active, buffer, length, 0, 0);
	}
	if (errno != ENOENT) {
		fprintf(stderr, "read %s: %s\n", disabled, strerror(errno));
		return 1;
	}
	return -1;
}

static int list_sources(void) {
	char buffer[MAX_FEED_BYTES + 1];
	int first = 1;
	fputs("{\"sources\":[", stdout);

	int system_status = emit_source_from_paths(
		&first,
		SYSTEM_FEED_NAME,
		SYSTEM_FEED_PATH,
		1,
		buffer,
		sizeof(buffer)
	);
	if (system_status > 0) {
		return 1;
	}

	DIR *dir = opendir(OPKG_CONF_DIR);
	if (!dir) {
		if (errno == ENOENT) {
			fputs("]}\n", stdout);
			return 0;
		}
		fprintf(stderr, "open %s: %s\n", OPKG_CONF_DIR, strerror(errno));
		return 1;
	}

	char **names = NULL;
	size_t count = 0;
	size_t capacity = 0;
	struct dirent *entry;
	while ((entry = readdir(dir)) != NULL) {
		char stem[MAX_NAME_LEN + 1];
		if (!custom_stem(entry->d_name, stem, sizeof(stem))) {
			continue;
		}
		if (push_unique_name(&names, &count, &capacity, stem) != 0) {
			closedir(dir);
			for (size_t index = 0; index < count; index++) {
				free(names[index]);
			}
			free(names);
			return 1;
		}
	}
	closedir(dir);

	for (size_t i = 0; i + 1 < count; i++) {
		for (size_t j = i + 1; j < count; j++) {
			if (strcmp(names[i], names[j]) > 0) {
				char *tmp = names[i];
				names[i] = names[j];
				names[j] = tmp;
			}
		}
	}

	int status = 0;
	for (size_t index = 0; index < count; index++) {
		char path[512];
		if (custom_config_path(names[index], path, sizeof(path)) != 0) {
			status = 1;
			break;
		}
		int emitted = emit_source_from_paths(&first, names[index], path, 0, buffer, sizeof(buffer));
		if (emitted > 0) {
			status = 1;
			break;
		}
	}
	for (size_t index = 0; index < count; index++) {
		free(names[index]);
	}
	free(names);
	if (status != 0) {
		return 1;
	}
	fputs("]}\n", stdout);
	return 0;
}

static int set_source(const char *key, const char *name, const char *text) {
	char path[512];
	char disabled[512];
	char stripped[MAX_FEED_BYTES + 1];
	char composed[MAX_FEED_BYTES + 256];
	char display[MAX_DISPLAY_BYTES + 1];
	char unused[MAX_DISPLAY_BYTES + 1];
	size_t length = 0;
	size_t composed_len = 0;
	if (custom_config_path(key, path, sizeof(path)) != 0) {
		return 1;
	}
	snprintf(display, sizeof(display), "%s", name);
	trim_inplace(display);
	if (!valid_display_name(display)) {
		fprintf(stderr, "invalid source name\n");
		return 1;
	}
	if (strlen(text) > MAX_FEED_BYTES) {
		fprintf(stderr, "feed configuration exceeds %d bytes\n", MAX_FEED_BYTES);
		return 1;
	}
	snprintf(stripped, sizeof(stripped), "%s", text);
	length = strlen(stripped);
	strip_source_headers(stripped, &length, unused, sizeof(unused));
	if (validate_feeds(stripped) != 0) {
		return 1;
	}
	if (compose_source_file(key, display, stripped, composed, sizeof(composed), &composed_len) != 0) {
		return 1;
	}
	if (write_all(path, composed, composed_len) != 0) {
		return 1;
	}
	if (append_disabled_suffix(path, disabled, sizeof(disabled)) != 0) {
		return 1;
	}
	return unlink_if_exists(disabled);
}

static int remove_source(const char *name) {
	char path[512];
	char disabled[512];
	if (custom_config_path(name, path, sizeof(path)) != 0) {
		return 1;
	}
	if (append_disabled_suffix(path, disabled, sizeof(disabled)) != 0) {
		return 1;
	}
	if (unlink_if_exists(path) != 0 || unlink_if_exists(disabled) != 0) {
		return 1;
	}
	return 0;
}

static int set_source_enabled(int builtin, const char *name, int enabled) {
	if (builtin) {
		return set_path_enabled(SYSTEM_FEED_PATH, enabled);
	}
	char path[512];
	if (custom_config_path(name, path, sizeof(path)) != 0) {
		return 1;
	}
	return set_path_enabled(path, enabled);
}

static char *read_stdin(void) {
	size_t capacity = 4096;
	size_t length = 0;
	char *buffer = malloc(capacity);
	if (!buffer) {
		return NULL;
	}
	while (!feof(stdin)) {
		if (length + 1024 >= capacity) {
			capacity *= 2;
			char *resized = realloc(buffer, capacity);
			if (!resized) {
				free(buffer);
				return NULL;
			}
			buffer = resized;
		}
		size_t got = fread(buffer + length, 1, 1024, stdin);
		length += got;
		if (ferror(stdin)) {
			free(buffer);
			return NULL;
		}
	}
	buffer[length] = '\0';
	return buffer;
}

static const char *json_string_field(const char *json, const char *field) {
	char pattern[64];
	snprintf(pattern, sizeof(pattern), "\"%s\"", field);
	const char *key = strstr(json, pattern);
	if (!key) {
		return NULL;
	}
	key = strchr(key + strlen(pattern), ':');
	if (!key) {
		return NULL;
	}
	key++;
	while (*key && isspace((unsigned char)*key)) {
		key++;
	}
	if (*key != '"') {
		return NULL;
	}
	return key + 1;
}

static int json_bool_field(const char *json, const char *field, int *out) {
	char pattern[64];
	snprintf(pattern, sizeof(pattern), "\"%s\"", field);
	const char *key = strstr(json, pattern);
	if (!key) {
		return 1;
	}
	key = strchr(key + strlen(pattern), ':');
	if (!key) {
		return 1;
	}
	key++;
	while (*key && isspace((unsigned char)*key)) {
		key++;
	}
	if (strncmp(key, "true", 4) == 0 && !isalnum((unsigned char)key[4]) && key[4] != '_') {
		*out = 1;
		return 0;
	}
	if (strncmp(key, "false", 5) == 0 && !isalnum((unsigned char)key[5]) && key[5] != '_') {
		*out = 0;
		return 0;
	}
	return 1;
}

static char *decode_json_string(const char *start) {
	size_t capacity = strlen(start) + 1;
	char *out = malloc(capacity);
	if (!out) {
		return NULL;
	}
	size_t length = 0;
	for (const char *cursor = start; *cursor && *cursor != '"'; cursor++) {
		char value = *cursor;
		if (value == '\\') {
			cursor++;
			switch (*cursor) {
			case '\\':
			case '"':
			case '/':
				value = *cursor;
				break;
			case 'n':
				value = '\n';
				break;
			case 'r':
				value = '\r';
				break;
			case 't':
				value = '\t';
				break;
			default:
				free(out);
				return NULL;
			}
		}
		out[length++] = value;
	}
	out[length] = '\0';
	return out;
}

static int package_installed(const char *id) {
	char path[512];
	snprintf(path, sizeof(path), "%s/%s", APPS_ROOT, id);
	struct stat st;
	return stat(path, &st) == 0 && S_ISDIR(st.st_mode);
}

static int base64_decode(const char *input, unsigned char **out, size_t *out_len) {
	signed char table[256];
	memset(table, -1, sizeof(table));
	const char *alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
	for (int i = 0; alphabet[i]; i++) {
		table[(unsigned char)alphabet[i]] = (signed char)i;
	}
	size_t cleaned_len = 0;
	for (const char *cursor = input; *cursor; cursor++) {
		if (!isspace((unsigned char)*cursor)) {
			cleaned_len++;
		}
	}
	if (cleaned_len == 0 || cleaned_len % 4 != 0) {
		return 1;
	}
	char *clean = malloc(cleaned_len + 1);
	if (!clean) {
		return 1;
	}
	size_t n = 0;
	for (const char *cursor = input; *cursor; cursor++) {
		if (!isspace((unsigned char)*cursor)) {
			clean[n++] = *cursor;
		}
	}
	clean[n] = '\0';
	unsigned char *buffer = malloc(n);
	if (!buffer) {
		free(clean);
		return 1;
	}
	size_t length = 0;
	for (size_t i = 0; i < n; i += 4) {
		int a = clean[i] == '=' ? 0 : table[(unsigned char)clean[i]];
		int b = clean[i + 1] == '=' ? 0 : table[(unsigned char)clean[i + 1]];
		int c = clean[i + 2] == '=' ? 0 : table[(unsigned char)clean[i + 2]];
		int d = clean[i + 3] == '=' ? 0 : table[(unsigned char)clean[i + 3]];
		if (a < 0 || b < 0 || (clean[i + 2] != '=' && c < 0) || (clean[i + 3] != '=' && d < 0)) {
			free(clean);
			free(buffer);
			return 1;
		}
		buffer[length++] = (unsigned char)((a << 2) | (b >> 4));
		if (clean[i + 2] != '=') {
			buffer[length++] = (unsigned char)((b << 4) | (c >> 2));
		}
		if (clean[i + 3] != '=') {
			buffer[length++] = (unsigned char)((c << 6) | d);
		}
	}
	free(clean);
	*out = buffer;
	*out_len = length;
	return 0;
}

static int json_extract_string(const char *json, const char *field, char *out, size_t out_size) {
	const char *start = json_string_field(json, field);
	if (!start) {
		return 1;
	}
	char *decoded = decode_json_string(start);
	if (!decoded) {
		return 1;
	}
	if (strlen(decoded) >= out_size) {
		free(decoded);
		return 1;
	}
	memcpy(out, decoded, strlen(decoded) + 1);
	free(decoded);
	return 0;
}

typedef struct {
	char id[MAX_NAME_LEN + 1];
	char package[128];
	char name[256];
	char description[1024];
	char version[96];
	int installed;
} PackageEntry;

static int control_field(const char *paragraph, const char *key, char *out, size_t out_size) {
	size_t key_len = strlen(key);
	const char *cursor = paragraph;
	while (*cursor) {
		const char *line_end = strchr(cursor, '\n');
		size_t line_len = line_end ? (size_t)(line_end - cursor) : strlen(cursor);
		if (line_len > key_len + 2 && strncmp(cursor, key, key_len) == 0 && cursor[key_len] == ':') {
			const char *value = cursor + key_len + 1;
			while (*value == ' ' || *value == '\t') {
				value++;
			}
			size_t value_len = line_len - (size_t)(value - cursor);
			/* Fold continuation lines (leading space/tab). */
			char folded[MAX_FIELD];
			size_t folded_len = 0;
			if (value_len >= sizeof(folded)) {
				return 1;
			}
			memcpy(folded, value, value_len);
			folded_len = value_len;
			const char *next = line_end ? line_end + 1 : cursor + line_len;
			while (*next == ' ' || *next == '\t') {
				const char *cont_end = strchr(next, '\n');
				size_t cont_len = cont_end ? (size_t)(cont_end - next) : strlen(next);
				while (cont_len > 0 && (next[0] == ' ' || next[0] == '\t')) {
					next++;
					cont_len--;
				}
				if (folded_len + 1 + cont_len >= sizeof(folded)) {
					return 1;
				}
				folded[folded_len++] = ' ';
				memcpy(folded + folded_len, next, cont_len);
				folded_len += cont_len;
				next = cont_end ? cont_end + 1 : next + cont_len;
			}
			folded[folded_len] = '\0';
			if (folded_len >= out_size) {
				return 1;
			}
			memcpy(out, folded, folded_len + 1);
			return 0;
		}
		if (!line_end) {
			break;
		}
		cursor = line_end + 1;
	}
	return 1;
}

static int parse_extension_paragraph(const char *paragraph, PackageEntry *entry) {
	char package[128];
	char manifest_b64[MAX_FIELD];
	char version[96];
	char description[1024];
	if (control_field(paragraph, "Package", package, sizeof(package)) != 0) {
		return 1;
	}
	if (strncmp(package, "onekvm-extension-", 17) != 0) {
		return 1;
	}
	const char *id = package + 17;
	if (!valid_extension_id(id) || strcmp(id, HOST_ID) == 0 || strcmp(id, "plugin-market") == 0) {
		return 1;
	}
	if (strlen(id) > MAX_NAME_LEN) {
		return 1;
	}
	if (control_field(paragraph, "X-OneKVM-Extension-Manifest", manifest_b64, sizeof(manifest_b64)) != 0) {
		return 1;
	}
	memset(entry, 0, sizeof(*entry));
	snprintf(entry->id, sizeof(entry->id), "%s", id);
	snprintf(entry->package, sizeof(entry->package), "%s", package);
	if (control_field(paragraph, "X-OneKVM-Extension-Version", version, sizeof(version)) == 0) {
		snprintf(entry->version, sizeof(entry->version), "%s", version);
	} else if (control_field(paragraph, "Version", version, sizeof(version)) == 0) {
		snprintf(entry->version, sizeof(entry->version), "%s", version);
	}
	if (control_field(paragraph, "Description", description, sizeof(description)) == 0) {
		snprintf(entry->description, sizeof(entry->description), "%s", description);
		snprintf(entry->name, sizeof(entry->name), "%.*s", (int)sizeof(entry->name) - 1, description);
	} else {
		snprintf(entry->name, sizeof(entry->name), "%s", id);
	}
	unsigned char *decoded = NULL;
	size_t decoded_len = 0;
	if (base64_decode(manifest_b64, &decoded, &decoded_len) == 0 && decoded_len > 0) {
		char *json = malloc(decoded_len + 1);
		if (json) {
			memcpy(json, decoded, decoded_len);
			json[decoded_len] = '\0';
			char name[256];
			char desc[1024];
			char ver[96];
			if (json_extract_string(json, "name", name, sizeof(name)) == 0) {
				snprintf(entry->name, sizeof(entry->name), "%s", name);
			}
			if (json_extract_string(json, "description", desc, sizeof(desc)) == 0) {
				snprintf(entry->description, sizeof(entry->description), "%s", desc);
			}
			if (entry->version[0] == '\0' && json_extract_string(json, "version", ver, sizeof(ver)) == 0) {
				snprintf(entry->version, sizeof(entry->version), "%s", ver);
			}
			free(json);
		}
		free(decoded);
	}
	entry->installed = package_installed(entry->id);
	return 0;
}

static int list_packages(void) {
	DIR *dir = opendir(OPKG_LISTS_DIR);
	fputs("{\"packages\":[", stdout);
	if (!dir) {
		if (errno == ENOENT) {
			fputs("]}\n", stdout);
			return 0;
		}
		fprintf(stderr, "open %s: %s\n", OPKG_LISTS_DIR, strerror(errno));
		return 1;
	}

	PackageEntry *entries = NULL;
	size_t count = 0;
	size_t capacity = 0;
	struct dirent *dent;
	while ((dent = readdir(dir)) != NULL) {
		if (dent->d_name[0] == '.') {
			continue;
		}
		size_t name_len = strlen(dent->d_name);
		if (name_len > 4 && strcmp(dent->d_name + name_len - 4, ".asc") == 0) {
			continue;
		}
		char path[512];
		snprintf(path, sizeof(path), "%s/%s", OPKG_LISTS_DIR, dent->d_name);
		FILE *file = fopen(path, "r");
		if (!file) {
			continue;
		}
		char *paragraph = NULL;
		size_t paragraph_cap = 0;
		size_t paragraph_len = 0;
		char line[4096];
		while (fgets(line, sizeof(line), file)) {
			if (strcmp(line, "\n") == 0) {
				if (paragraph_len > 0) {
					paragraph[paragraph_len] = '\0';
					PackageEntry entry;
					if (parse_extension_paragraph(paragraph, &entry) == 0) {
						int replace = -1;
						for (size_t i = 0; i < count; i++) {
							if (strcmp(entries[i].id, entry.id) == 0) {
								replace = (int)i;
								break;
							}
						}
						if (replace >= 0) {
							if (strcmp(entry.version, entries[replace].version) > 0) {
								entries[replace] = entry;
							}
						} else {
							if (count == capacity) {
								capacity = capacity ? capacity * 2 : 16;
								PackageEntry *resized = realloc(entries, capacity * sizeof(*entries));
								if (!resized) {
									fclose(file);
									closedir(dir);
									free(paragraph);
									free(entries);
									fprintf(stderr, "out of memory\n");
									return 1;
								}
								entries = resized;
							}
							entries[count++] = entry;
						}
					}
					paragraph_len = 0;
				}
				continue;
			}
			size_t line_len = strlen(line);
			if (paragraph_len + line_len + 1 > paragraph_cap) {
				paragraph_cap = paragraph_cap ? paragraph_cap * 2 : 8192;
				while (paragraph_len + line_len + 1 > paragraph_cap) {
					paragraph_cap *= 2;
				}
				char *resized = realloc(paragraph, paragraph_cap);
				if (!resized) {
					fclose(file);
					closedir(dir);
					free(paragraph);
					free(entries);
					fprintf(stderr, "out of memory\n");
					return 1;
				}
				paragraph = resized;
			}
			memcpy(paragraph + paragraph_len, line, line_len);
			paragraph_len += line_len;
		}
		if (paragraph_len > 0) {
			paragraph[paragraph_len] = '\0';
			PackageEntry entry;
			if (parse_extension_paragraph(paragraph, &entry) == 0) {
				int replace = -1;
				for (size_t i = 0; i < count; i++) {
					if (strcmp(entries[i].id, entry.id) == 0) {
						replace = (int)i;
						break;
					}
				}
				if (replace >= 0) {
					if (strcmp(entry.version, entries[replace].version) > 0) {
						entries[replace] = entry;
					}
				} else {
					if (count == capacity) {
						capacity = capacity ? capacity * 2 : 16;
						PackageEntry *resized = realloc(entries, capacity * sizeof(*entries));
						if (!resized) {
							fclose(file);
							closedir(dir);
							free(paragraph);
							free(entries);
							fprintf(stderr, "out of memory\n");
							return 1;
						}
						entries = resized;
					}
					entries[count++] = entry;
				}
			}
		}
		free(paragraph);
		fclose(file);
	}
	closedir(dir);

	for (size_t i = 0; i + 1 < count; i++) {
		for (size_t j = i + 1; j < count; j++) {
			if (strcmp(entries[i].id, entries[j].id) > 0) {
				PackageEntry tmp = entries[i];
				entries[i] = entries[j];
				entries[j] = tmp;
			}
		}
	}

	for (size_t index = 0; index < count; index++) {
		if (index > 0) {
			fputc(',', stdout);
		}
		fputs("{\"id\":", stdout);
		json_escape_write(stdout, entries[index].id, strlen(entries[index].id));
		fputs(",\"package\":", stdout);
		json_escape_write(stdout, entries[index].package, strlen(entries[index].package));
		fputs(",\"name\":", stdout);
		json_escape_write(stdout, entries[index].name, strlen(entries[index].name));
		fputs(",\"description\":", stdout);
		json_escape_write(stdout, entries[index].description, strlen(entries[index].description));
		fputs(",\"version\":", stdout);
		json_escape_write(stdout, entries[index].version, strlen(entries[index].version));
		fprintf(stdout, ",\"installed\":%s}", entries[index].installed ? "true" : "false");
	}
	free(entries);
	fputs("]}\n", stdout);
	return 0;
}

static int run_host_cli(const char *action, const char *package) {
	pid_t pid = fork();
	if (pid < 0) {
		fprintf(stderr, "fork: %s\n", strerror(errno));
		return 1;
	}
	if (pid == 0) {
		execl(HOST_CLI, HOST_CLI, action, package, (char *)NULL);
		_exit(127);
	}
	int status = 0;
	if (waitpid(pid, &status, 0) < 0) {
		fprintf(stderr, "waitpid: %s\n", strerror(errno));
		return 1;
	}
	if (!WIFEXITED(status) || WEXITSTATUS(status) != 0) {
		fprintf(stderr, "%s %s failed\n", action, package);
		return 1;
	}
	return 0;
}

static int resolve_package_arg(const char *payload, char *out, size_t out_size) {
	const char *package_field = json_string_field(payload, "package");
	const char *id_field = json_string_field(payload, "id");
	char *package = package_field ? decode_json_string(package_field) : NULL;
	char *id = id_field ? decode_json_string(id_field) : NULL;
	int status = 1;
	if (package && package[0]) {
		if (strncmp(package, "onekvm-extension-", 17) == 0 && valid_extension_id(package + 17)) {
			snprintf(out, out_size, "%s", package);
			status = 0;
		} else if (valid_extension_id(package)) {
			snprintf(out, out_size, "onekvm-extension-%s", package);
			status = 0;
		}
	} else if (id && valid_extension_id(id)) {
		snprintf(out, out_size, "onekvm-extension-%s", id);
		status = 0;
	}
	free(package);
	free(id);
	if (status != 0) {
		fprintf(stderr, "package or id is required\n");
	}
	return status;
}

static char *decode_source_key(const char *payload) {
	const char *key_field = json_string_field(payload, "key");
	const char *name_field = json_string_field(payload, "name");
	if (key_field) {
		return decode_json_string(key_field);
	}
	if (name_field) {
		return decode_json_string(name_field);
	}
	return NULL;
}

int main(int argc, char **argv) {
	if (argc == 2 && strcmp(argv[1], "--health") == 0) {
		return 0;
	}
	if (argc == 2 && strcmp(argv[1], "list-sources") == 0) {
		return list_sources();
	}
	if (argc == 2 && strcmp(argv[1], "list-packages") == 0) {
		return list_packages();
	}
	if (argc == 2 && strcmp(argv[1], "set-source") == 0) {
		char *payload = read_stdin();
		if (!payload) {
			fprintf(stderr, "read invoke payload failed\n");
			return 1;
		}
		const char *key_field = json_string_field(payload, "key");
		const char *name_field = json_string_field(payload, "name");
		const char *text_field = json_string_field(payload, "feeds_text");
		if (!text_field || (!key_field && !name_field)) {
			free(payload);
			fprintf(stderr, "key, name, and feeds_text are required\n");
			return 1;
		}
		char *key = key_field ? decode_json_string(key_field) : NULL;
		char *name = name_field ? decode_json_string(name_field) : NULL;
		char *text = decode_json_string(text_field);
		free(payload);
		if (!key && name) {
			key = strdup(name);
		}
		if (!name && key) {
			name = strdup(key);
		}
		if (!key || !name || !text) {
			free(key);
			free(name);
			free(text);
			fprintf(stderr, "invalid key, name, or feeds_text\n");
			return 1;
		}
		int status = set_source(key, name, text);
		free(key);
		free(name);
		free(text);
		if (status == 0) {
			fputs("{\"status\":\"ok\"}\n", stdout);
		}
		return status;
	}
	if (argc == 2 && strcmp(argv[1], "set-source-enabled") == 0) {
		char *payload = read_stdin();
		if (!payload) {
			fprintf(stderr, "read invoke payload failed\n");
			return 1;
		}
		int enabled = 0;
		int builtin = 0;
		if (json_bool_field(payload, "enabled", &enabled) != 0) {
			free(payload);
			fprintf(stderr, "enabled is required\n");
			return 1;
		}
		json_bool_field(payload, "builtin", &builtin);
		char *name = NULL;
		if (!builtin) {
			name = decode_source_key(payload);
			if (!name) {
				free(payload);
				fprintf(stderr, "key is required\n");
				return 1;
			}
		}
		free(payload);
		int status = set_source_enabled(builtin, name, enabled);
		free(name);
		if (status == 0) {
			fputs("{\"status\":\"ok\"}\n", stdout);
		}
		return status;
	}
	if (argc == 2 && strcmp(argv[1], "remove-source") == 0) {
		char *payload = read_stdin();
		if (!payload) {
			fprintf(stderr, "read invoke payload failed\n");
			return 1;
		}
		char *name = decode_source_key(payload);
		free(payload);
		if (!name) {
			fprintf(stderr, "key is required\n");
			return 1;
		}
		int status = remove_source(name);
		free(name);
		if (status == 0) {
			fputs("{\"status\":\"ok\"}\n", stdout);
		}
		return status;
	}
	if (argc == 2 && strcmp(argv[1], "install-progress") == 0) {
		fputs("{\"status\":\"idle\",\"phase\":\"idle\",\"percent\":null,\"bytes\":0,\"total_bytes\":0,\"message\":\"\",\"error\":\"\",\"active\":false,\"package\":\"\"}\n", stdout);
		return 0;
	}
	if (argc == 2 && (strcmp(argv[1], "install-package") == 0 || strcmp(argv[1], "remove-package") == 0)) {
		char *payload = read_stdin();
		if (!payload) {
			fprintf(stderr, "read invoke payload failed\n");
			return 1;
		}
		char package[128];
		if (resolve_package_arg(payload, package, sizeof(package)) != 0) {
			free(payload);
			return 1;
		}
		free(payload);
		const char *action = strcmp(argv[1], "install-package") == 0 ? "install" : "remove";
		if (run_host_cli(action, package) != 0) {
			return 1;
		}
		fputs("{\"status\":\"ok\",\"package\":", stdout);
		json_escape_write(stdout, package, strlen(package));
		fputs("}\n", stdout);
		return 0;
	}
	fprintf(stderr,
		"usage: %s --health|list-sources|list-packages|set-source|set-source-enabled|remove-source|install-package|install-progress|remove-package\n",
		argv[0]);
	return 2;
}
