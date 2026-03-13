"""
Upload dist/ to Alibaba Cloud server via SFTP.
Called by deploy.ps1
"""
import paramiko, sys
from pathlib import Path

HOST       = "8.162.7.82"
USER       = "root"
PASSWORD   = "Hxsk@2016"
LOCAL_DIST = Path(__file__).parent.parent / "dist"
REMOTE_DIR = "/www/wwwroot/lab.tanpeak.com"


def upload_dir(sftp, local: Path, remote: str):
    try:
        sftp.mkdir(remote)
    except OSError:
        pass
    for item in local.iterdir():
        r = f"{remote}/{item.name}"
        if item.is_dir():
            upload_dir(sftp, item, r)
        else:
            sftp.put(str(item), r)
            print(f"  uploaded: {item.relative_to(LOCAL_DIST)}")


def main():
    print(f"Connecting to {HOST}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASSWORD, timeout=20)

    sftp = ssh.open_sftp()
    print(f"Uploading to {REMOTE_DIR}...")
    upload_dir(sftp, LOCAL_DIST, REMOTE_DIR)

    # Reload nginx
    _, out, _ = ssh.exec_command("nginx -s reload 2>&1")
    out.channel.recv_exit_status()

    sftp.close()
    ssh.close()
    print("Server updated and nginx reloaded.")


if __name__ == "__main__":
    main()
