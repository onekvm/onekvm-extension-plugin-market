#include <ctype.h>
#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

#define FEED_CONFIG "/etc/opkg/onekvm-feed.conf"
#define MAX_FEED_BYTES (16 * 1024)

static int write_all(const char *path, const char *data, size_t length) {
	char temporary[sizeof(FEED_CONFIG) + 16];
	char directory[sizeof(FEED_CONFIG)];
	const char *slash = strrchr(path, '/');
	if (slash && slash != path) {
		size_t dir_length = (size_t)(slash - path);
		if (dir_length >= sizeof(directory)) {
			fprintf(stderr, "feed config path too long\n");
			return 1;
		}
		memcpy(directory, path, dir_length);
		directory[dir_length] = '\0';
		if (mkdir(directory, 0755) != 0 && errno != EEXIST) {
			fprintf(stderr, "mkdir %s: %s\n", directory, strerror(errno));
			return 1;
		}
	}
	snprintf(temporary, sizeof(temporary), "%s.tmp", path);
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
	}
	return 0;
}

static int get_feeds(void) {
	FILE *file = fopen(FEED_CONFIG, "r");
	if (!file) {
		if (errno == ENOENT) {
			fputs("{\"feeds_text\":\"\"}\n", stdout);
			return 0;
		}
		fprintf(stderr, "open %s: %s\n", FEED_CONFIG, strerror(errno));
		return 1;
	}
	char buffer[MAX_FEED_BYTES + 1];
	size_t length = fread(buffer, 1, MAX_FEED_BYTES, file);
	int read_error = ferror(file);
	fclose(file);
	if (read_error) {
		fprintf(stderr, "read %s failed\n", FEED_CONFIG);
		return 1;
	}
	buffer[length] = '\0';
	fputs("{\"feeds_text\":", stdout);
	fputc('"', stdout);
	for (size_t index = 0; index < length; index++) {
		unsigned char byte = (unsigned char)buffer[index];
		switch (byte) {
		case '\\':
		case '"':
			fputc('\\', stdout);
			fputc(byte, stdout);
			break;
		case '\n':
			fputs("\\n", stdout);
			break;
		case '\r':
			fputs("\\r", stdout);
			break;
		case '\t':
			fputs("\\t", stdout);
			break;
		default:
			if (byte < 0x20) {
				fprintf(stdout, "\\u%04x", byte);
			} else {
				fputc(byte, stdout);
			}
			break;
		}
	}
	fputs("\"}\n", stdout);
	return 0;
}

static int set_feeds(const char *text) {
	if (strlen(text) > MAX_FEED_BYTES) {
		fprintf(stderr, "feed configuration exceeds %d bytes\n", MAX_FEED_BYTES);
		return 1;
	}
	if (validate_feeds(text) != 0) {
		return 1;
	}
	return write_all(FEED_CONFIG, text, strlen(text));
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

int main(int argc, char **argv) {
	if (argc == 2 && strcmp(argv[1], "--health") == 0) {
		return 0;
	}
	if (argc == 2 && strcmp(argv[1], "get-feeds") == 0) {
		return get_feeds();
	}
	if (argc == 2 && strcmp(argv[1], "set-feeds") == 0) {
		char *payload = read_stdin();
		if (!payload) {
			fprintf(stderr, "read invoke payload failed\n");
			return 1;
		}
		const char *field = json_string_field(payload, "feeds_text");
		if (!field) {
			free(payload);
			fprintf(stderr, "feeds_text is required\n");
			return 1;
		}
		char *text = decode_json_string(field);
		free(payload);
		if (!text) {
			fprintf(stderr, "invalid feeds_text\n");
			return 1;
		}
		int status = set_feeds(text);
		free(text);
		if (status == 0) {
			fputs("{\"status\":\"ok\"}\n", stdout);
		}
		return status;
	}
	fprintf(stderr, "usage: %s --health|get-feeds|set-feeds\n", argv[0]);
	return 2;
}
