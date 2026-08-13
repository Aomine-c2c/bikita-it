import re
from ninja.errors import HttpError

MAC_REGEX = re.compile(r"^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$")

def validate_mac_address(mac: str):
    if not mac:
        return
    if not MAC_REGEX.match(mac):
        raise HttpError(400, "Invalid MAC address format")
