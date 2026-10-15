SUMMARY = "OneKVM plugin marketplace extension"
HOMEPAGE = "https://github.com/onekvm/onekvm-extension-plugin-market"
LICENSE = "GPL-3.0-only"
LIC_FILES_CHKSUM = "file://LICENSE;md5=1ebbd3e34237af26da5dc08a4e440464"
PR = "r19"

ONEKVM_COMPONENT_GIT_URI ??= "git://github.com/onekvm/onekvm-extension-plugin-market.git;protocol=https;branch=main"
ONEKVM_COMPONENT_SRCREV ??= ""
SRC_URI = "${ONEKVM_COMPONENT_GIT_URI}"
SRCREV = "${ONEKVM_COMPONENT_SRCREV}"

inherit onekvm-extension

ONEKVM_EXTENSION_ID = "plugin-marketplace"
ONEKVM_EXTENSION_API_VERSION = "2"
ONEKVM_EXTENSION_MANIFEST_TEMPLATE = "${S}/manifest.json.in"

# Migrate from the short-lived plugin-market package / id.
RPROVIDES:${PN} += "onekvm-extension-plugin-market"
RREPLACES:${PN} += "onekvm-extension-plugin-market"
RCONFLICTS:${PN} += "onekvm-extension-plugin-market"

do_compile() {
    oe_runmake -C ${S} clean
    oe_runmake -C ${S} all \
        CC="${CC}" \
        "CFLAGS=${CFLAGS}" \
        "LDFLAGS=${LDFLAGS}" \
        VERSION=${PV} ARCH=${TARGET_ARCH}
}

do_install() {
    oe_runmake -C ${S} install \
        DESTDIR=${D} PREFIX=${ONEKVM_EXTENSION_ROOT} \
        VERSION=${PV} ARCH=${TARGET_ARCH}
}
