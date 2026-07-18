import { useEffect, useState, useMemo } from "react";
import { Search, ShieldAlert, Shield, Terminal, ArrowDown } from "lucide-react";
import { Table, Column } from "../components/layout/Table";
import { Pagination } from "../components/layout/Pagination";
import { Loader } from "../components/layout/Loader";
import { notificationsService } from "../services/notifications";
import { AdminActivityLog } from "../services/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ActivityLogs() {
  const [logs, setLogs] = useState<AdminActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortKey, setSortKey] = useState("timestamp");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await notificationsService.getActivityLogs();
      setLogs(data);
    } catch {
      toast.error("Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

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
          l.userName.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          l.module.toLowerCase().includes(q) ||
          l.ipAddress.includes(q),
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

  useEffect(() => {
    setCurrentPage(1);
  }, [search, moduleFilter]);

  // Extract unique modules
  const modules = useMemo(() => {
    const set = new Set(logs.map((l) => l.module));
    return Array.from(set);
  }, [logs]);

  const columns: Column<AdminActivityLog>[] = [
    {
      key: "timestamp",
      label: "Date & Time",
      sortable: true,
      render: (row) => (
        <span className="text-xs font-semibold text-muted-foreground">
          {new Date(row.timestamp).toLocaleString()}
        </span>
      ),
    },
    {
      key: "userName",
      label: "Triggered By",
      sortable: true,
      render: (row) => <span className="text-xs font-bold">{row.userName}</span>,
    },
    {
      key: "action",
      label: "System Event / Action",
      sortable: true,
      render: (row) => <span className="text-xs font-bold text-foreground">{row.action}</span>,
    },
    {
      key: "module",
      label: "Target Module",
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
          {row.module}
        </span>
      ),
    },
    {
      key: "ipAddress",
      label: "IP Address",
      sortable: true,
      render: (row) => (
        <span className="text-xs font-bold text-muted-foreground">{row.ipAddress}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Security Activity Logs</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Audit administrative modifications, authenticate logins, and trace system modifications
          events.
        </p>
      </div>

      {/* Query filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search logs by action, username, module, IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card/60 text-foreground text-xs rounded-xl pl-10 pr-4 py-3 border border-border focus:outline-none focus:border-primary transition-all placeholder:text-muted-foreground/60"
          />
        </div>

        {/* Module select filter */}
        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          className="bg-card/60 text-foreground text-xs rounded-xl px-4 py-3 border border-border focus:outline-none focus:border-primary transition-all"
        >
          <option value="all">All Modules</option>
          {modules.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {/* Table grid */}
      {loading ? (
        <Loader message="Accessing system timeline..." />
      ) : (
        <>
          <Table
            columns={columns}
            data={paginatedLogs}
            onSort={handleSort}
            sortKey={sortKey}
            sortOrder={sortOrder}
            emptyTitle="No activity logs found"
            emptyDescription="Try clearing filters or checking other dates."
          />
          <Pagination
            currentPage={currentPage}
            totalItems={filteredLogs.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </>
      )}
    </div>
  );
}
