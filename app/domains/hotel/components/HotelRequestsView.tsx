"use client";

import { useMemo, useState } from "react";
import {
  Clock01Icon as Clock,
  CheckmarkBadge01Icon as Ack,
  Time04Icon as Progress,
  CheckmarkCircle02Icon as Done,
  Activity03Icon as Activity,
  FilterIcon as Filter,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ManagementHeader } from "@/app/components/shared/ManagementHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { HotelTabs } from "./HotelTabs";
import { HotelStatTiles } from "./HotelStatTiles";
import { HotelListState } from "./HotelListState";
import { RequestBoard } from "./requests/RequestBoard";
import { useHotelServiceRequests } from "../hooks/useHotelQueries";
import { useHotelMutations } from "../hooks/useHotelMutations";
import { categoryMeta, REQUEST_CATEGORY_META } from "../constants";

const CATEGORY_OPTIONS = Object.entries(REQUEST_CATEGORY_META).map(([value, meta]) => ({
  value,
  label: meta.label,
}));

export function HotelRequestsView() {
  const requests = useHotelServiceRequests();
  const mutations = useHotelMutations();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const all = useMemo(() => requests.data ?? [], [requests.data]);

  const stats = useMemo(
    () => [
      {
        label: "New",
        value: all.filter((r) => r.status === "new").length,
        helper: "awaiting action",
        icon: Clock,
        tone: "warning" as const,
      },
      {
        label: "Acknowledged",
        value: all.filter((r) => r.status === "acknowledged").length,
        helper: "seen by staff",
        icon: Ack,
        tone: "info" as const,
      },
      {
        label: "In progress",
        value: all.filter((r) => r.status === "in_progress").length,
        helper: "being handled",
        icon: Progress,
        tone: "info" as const,
      },
      {
        label: "Completed",
        value: all.filter((r) => r.status === "completed").length,
        helper: "resolved",
        icon: Done,
        tone: "success" as const,
      },
    ],
    [all],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return all.filter((request) => {
      if (categoryFilter !== "all" && request.category !== categoryFilter) return false;
      if (!term) return true;
      return [categoryMeta(request.category).label, request.customer?.name, request.room?.number]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [all, search, categoryFilter]);

  return (
    <div className="space-y-6">
      <ManagementHeader
        title="Guest requests"
        description="Track housekeeping, laundry, spa, pickup, maintenance, and concierge work."
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by category, guest, or room..."
      />

      <HotelStatTiles stats={stats} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <HotelTabs />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="h-11 w-[180px] rounded-2xl">
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={Filter} className="h-4 w-4 text-brand-accent/50" />
              <SelectValue placeholder="All categories" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <HotelListState
        isLoading={requests.isLoading}
        isError={requests.isError}
        error={requests.error}
        isEmpty={filtered.length === 0}
        emptyIcon={Activity}
        emptyLabel={all.length === 0 ? "No guest requests yet" : "No matching requests"}
        emptyHint={
          all.length === 0
            ? "Guest requests from WhatsApp, calls, and the front desk show up here for your team to handle."
            : "Try a different search or category."
        }
        skeletonCount={4}
      >
        <RequestBoard requests={filtered} mutations={mutations} />
      </HotelListState>
    </div>
  );
}
