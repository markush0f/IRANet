from app.modules.scanner.process import scan_processes

for p in scan_processes(min_etimes_seconds=15):
    print(p.pid, p.comm, p.etimes, p.cwd, p.cmdline[:6])
