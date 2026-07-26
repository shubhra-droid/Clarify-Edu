import socket

def check_port(host, port):
    try:
        with socket.create_connection((host, port), timeout=2):
            print(f"Port {port} on {host} is open")
            return True
    except Exception as e:
        print(f"Port {port} on {host} is closed: {e}")
        return False

print("Checking databases...")
check_port("localhost", 27017)
check_port("localhost", 6379)
