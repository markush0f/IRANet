# Ira – Feature Scope & Implementation Matrix

This document lists **everything that can reasonably be implemented** in Ira, organized by **domain** and **technical responsibility**. It is meant as a **long-term reference**, not a mandatory checklist.

---

## 1. System (Global Server State)

### CPU

* CPU usage percentage
* CPU usage breakdown (user / system / idle / iowait / irq)
* CPU usage per core
* Load average (1m / 5m / 15m)
* Context switches
* Interrupt count

### Memory

* Total RAM
* Used / available memory
* Cache and buffers
* Swap total / used / free
* Swap activity

### OS & Uptime

* System uptime
* Boot time
* Operating system name and version
* Kernel version
* Hostname
* CPU architecture

---

## 2. Processes (Kernel-Level)

### Basic Process Data

* PID
* Process name / command
* CPU usage percentage
* Resident memory (RSS)
* Memory usage percentage
* Process state (R / S / D / Z / T)
* Process uptime
* Parent PID (PPID)

### Rankings

* Top processes by CPU
* Top processes by memory
* Long-running processes
* Zombie processes

### Advanced Views

* Process tree (parent → child)
* Processes grouped by user
* Processes grouped by state
* Thread count per process

---

## 3. Disk & Filesystem

### Disk Metrics

* Mounted filesystems
* Total / used / free disk space
* Disk usage percentage
* Inode usage
* Disk read/write throughput
* Disk I/O latency (if available)

### File Analysis

* Largest directories
* Largest files
* Disk growth over time
* Temporary files usage

---

## 4. Network

### Interfaces

* Network interface list
* RX / TX bytes
* RX / TX packets
* Error and drop counters

### Connectivity

* Open ports
* Listening services
* Active network connections
* Connections per process

### Traffic Analysis

* Bandwidth usage
* Top network-consuming processes
* External IP address
* DNS resolver configuration

---

## 5. Services (systemd)

### Service State

* List of services
* Active / inactive / failed services
* Startup duration
* Restart count

### Diagnostics

* Failed services
* Services consuming most CPU or RAM
* Service dependency tree

### Logs

* Recent service logs
* Error log extraction
* Log frequency analysis

---

## 6. Docker / Containers

### Containers

* Running and stopped containers
* CPU and memory usage per container
* Network usage per container
* Disk usage per container

### Images

* Image list
* Image size
* Dangling images

### Volumes & Networks

* Docker volumes and usage
* Orphaned volumes
* Docker network topology

---

## 7. Nginx / Web Servers

### Configuration

* Virtual hosts
* Enabled sites
* Listening ports
* SSL certificates and expiration

### Runtime Metrics

* Active connections
* Requests per second
* HTTP status code distribution
* Worker process usage

### Logs

* Access log statistics
* Error log inspection
* Top requested endpoints

---

## 8. Security (Read-Only Monitoring)

### System Security

* Failed login attempts
* Active SSH sessions
* Logged-in users
* Sudo usage

### Network Security

* Open firewall ports
* Suspicious connections
* Firewall status

---

## 9. Historical Data & Observability

### Metrics History

* CPU usage over time
* Memory usage over time
* Disk usage trends
* Load average trends
* Process activity trends

### Alerting (Future)

* CPU threshold alerts
* Disk space alerts
* Service failure alerts
* Container crash loops

---

## 10. Configuration & Extensibility

### Configuration

* Enable or disable modules
* Refresh intervals
* Threshold configuration

### API

* Unified overview endpoint
* Module-specific endpoints
* Health check endpoints

### Frontend

* Dashboard layouts
* Widgets
* Filters and search
* Dark mode
* Mobile-friendly views

---

## Implementation Guidance

This list is **not meant to be fully implemented at once**.

Recommended order of implementation:

1. Disk usage
2. Process states
3. CPU usage per core
4. systemd services
5. Docker integration
6. Historical metrics storage

Ira already has a **strong architectural foundation**. All future work is incremental expansion, not refactoring.
