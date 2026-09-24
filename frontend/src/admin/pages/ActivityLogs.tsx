import { useEffect, useState, useMemo, useCallback } from "react";
import { Search, Shield, RefreshCw, Lock, Terminal, ShieldAlert } from "lucide-react";
import { Table, Column } from "../components/layout/Table";
import { Pagination } from "../components/layout/Pagination";
import { notificationsService } from "../services/notifications";
import { AdminActivityLog } from "../services/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Helper function to sanitize and redact any sensitive strings from audit logs
function sanitizeLogText(text: string): string {
  if (!text) return "";
  return text
    .replace(/(password|secret|jwt|token|apiKey|api_key|key|auth)\s*[:=]\s*["']?[^"'\s,]+["']?/gi, "$1=REDACTED")
    .replace(/Bearer\s+[A-Za-z0-9-_=.]+/gi, "Bearer REDACTED");
}

export default function ActivityLogs() {
  const [logs, setLogs] = useState<AdminActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");

  // Sorting
  const [sortKey, setSortKey] = useState("timestamp");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  const fetchLogs = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const data = await notificationsService.getActivityLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
      if (!silent) setError("Failed to load security audit trail from database.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const filteredLogs = useMemo(() => {
    let result = [...logs];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          (l.userName && l.userName.toLowerCase().includes(q)) ||
          (l.action && l.action.toLowerCase().includes(q)) ||
          (l.module && l.module.toLowerCase().includes(q)) ||
          (l.ipAddress && l.ipAddress.includes(q))
      );
    }

    if (moduleFilter !== "all") {
      result = result.filter((l) => l.module === moduleFilter);
    }

    result.sort((a, b) => {
      const fieldA = (a as unknown as Record<string, string | number>)[sortKey];
      const fieldB = (b as unknown as Record<string, string | number>)[sortKey];

      if (typeof fieldA === "string" && typeof fieldB === "string") {
        return sortOrder === "asc" ? fieldA.localeCompare(fieldB) : fieldB.localeCompare(fieldA);
      }
      if (typeof fieldA === "number" && typeof fieldB === "number") {
        return sortOrder === "asc" ? fieldA - fieldB : fieldB - fieldA;
      }
      return 0;
    });

    return result;
  }, [logs, search, moduleFilter, sortKey, sortOrder]);

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  const modules = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => {
      if (l.module) set.add(l.module);
    });
    return Array.from(set);
  }, [logs]);

  const columns: Column<AdminActivityLog>[] = [
    {
      key: "timestamp",
      label: "Timestamp",
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.timestamp ? new Date(row.timestamp).toLocaleString() : "—"}
        </span>
      ),
    },
    {
      key: "userName",
      label: "Actor / Admin",
      render: (row) => (
        <span className="font-bold text-foreground text-xs">{row.userName || "System"}</span>
      ),
    },
    {
      key: "module",
      label: "Module",
      render: (row) => (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-secondary border border-border/60 text-muted-foreground">
          {row.module || "General"}
        </span>
      ),
    },
    {
      key: "action",
      label: "Operation Performed",
      render: (row) => (
        <span className="text-xs text-foreground font-medium">
          {sanitizeLogText(row.action)}
        </span>
      ),
    },
    {
      key: "ipAddress",
      label: "IP Address",
      render: (row) => (
        <span className="font-mono text-[11px] text-muted-foreground">
          {row.ipAddress || "127.0.0.1"}
        </span>
      ),
    },
    {
      key: "result",
      label: "Status",
      render: () => (
        <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
          SUCCESS
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-border/50">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
            Activity Logs
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">
            Security audit trail, administrative action history, and access log stream
          </p>
        </div>

        <button
          onClick={() => fetchLogs()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/80 bg-secondary/50 hover:bg-secondary text-foreground text-xs font-medium transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={cn("h-3.5 w-3.5 text-muted-foreground", loading && "animate-spin")} />
          <span>Refresh</span>
        </button>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search logs by actor, action, IP..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-card text-foreground text-xs rounded-lg pl-9 pr-3 py-2 border border-border/70 focus:outline-none focus:border-foreground/40 font-medium placeholder:text-muted-foreground"
          />
        </div>

        {modules.length > 0 && (
          <select
            value={moduleFilter}
            onChange={(e) => {
              setModuleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-card text-foreground text-xs rounded-lg px-2.5 py-2 border border-border/70 focus:outline-none font-medium cursor-pointer"
          >
            <option value="all">All Modules</option>
            {modules.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* ERROR STATE */}
      {error && !loading ? (
        <div className="bg-card rounded-xl border border-red-500/20 p-8 text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-red-500/10 text-[#FF1744] flex items-center justify-center">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Database Sync Failed</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">{error}</p>
          </div>
          <button
            onClick={() => fetchLogs()}
            className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium transition-colors border border-border/80 cursor-pointer"
          >
            Retry Database Fetch
          </button>
        </div>
      ) : (
        /* TABLE */
        <div className="space-y-4">
          <Table
            columns={columns}
            data={paginatedLogs}
            loading={loading}
            sortKey={sortKey}
            sortOrder={sortOrder}
            onSort={handleSort}
            emptyTitle="No activity logs found"
            emptyDescription="No administrative activity records match your current filter settings."
          />

          {filteredLogs.length > itemsPerPage && (
            <Pagination
              currentPage={currentPage}
              totalItems={filteredLogs.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(newSize) => {
                setItemsPerPage(newSize);
                setCurrentPage(1);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
