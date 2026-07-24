import { ArrowLeft, CheckCircle2, Clock3, ExternalLink, RefreshCw, Send, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  getDispatchBatch,
  listDispatchBatches,
  type DispatchBatch,
  type DispatchBatchItem,
} from "../../api/requests.api";
import { getSelectedUnitCode } from "../../api/session.api";

function textValue(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function labelStatus(value?: string | null) {
  return textValue(value, "UNKNOWN").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function isActiveStatus(batch?: DispatchBatch | null) {
  const status = textValue(batch?.batchStatus).toUpperCase();
  return status === "QUEUED" || status === "PROCESSING";
}

function itemRunCode(item: DispatchBatchItem) {
  return textValue(item.dispatchRunCode) || textValue(item.resultPayload?.dispatchRunCode);
}

function itemPeriod(item: DispatchBatchItem) {
  const requestPayload = item.requestPayload ?? {};
  const run = requestPayload.run && typeof requestPayload.run === "object" ? (requestPayload.run as Record<string, unknown>) : {};
  return textValue(run.request_period_label) || textValue(run.request_period_code);
}

function itemDispatchLabel(item: DispatchBatchItem) {
  const metadata =
    item.requestPayload?.itemMetadata && typeof item.requestPayload.itemMetadata === "object"
      ? (item.requestPayload.itemMetadata as Record<string, unknown>)
      : {};
  return {
    label: textValue(item.itemLabel) || textValue(metadata.indicatorCode) || textValue(item.dispatchPlanCode),
    ministry: textValue(metadata.ministryName, "-"),
    department: textValue(metadata.departmentName, "-"),
    indicator: textValue(metadata.indicatorCode, "-"),
    template: textValue(metadata.templateVersionCode, "-"),
  };
}

export function DispatchBatchesPage() {
  const unitCode = getSelectedUnitCode();
  const { batchCode } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [batches, setBatches] = useState<DispatchBatch[]>([]);
  const [batch, setBatch] = useState<DispatchBatch | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState<string>(() => textValue((location.state as { notice?: string } | null)?.notice));
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const statusCounts = useMemo(() => {
    return batches.reduce<Record<string, number>>((counts, item) => {
      const status = textValue(item.batchStatus, "UNKNOWN").toUpperCase();
      counts[status] = (counts[status] ?? 0) + 1;
      return counts;
    }, {});
  }, [batches]);

  async function loadList() {
    setIsLoading(true);
    setError("");
    try {
      const data = await listDispatchBatches({
        unitCode,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        limit: 200,
      });
      setBatches(data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Dispatch batches could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadDetail() {
    if (!batchCode) return;
    setIsLoading(true);
    setError("");
    try {
      setBatch(await getDispatchBatch(batchCode, unitCode));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Dispatch batch could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (batchCode) void loadDetail();
    else void loadList();
  }, [batchCode, statusFilter, unitCode]);

  useEffect(() => {
    if (!batchCode || !isActiveStatus(batch)) return undefined;
    const timer = window.setInterval(() => void loadDetail(), 4000);
    return () => window.clearInterval(timer);
  }, [batchCode, batch?.batchStatus, unitCode]);

  const currentItems = batch?.items ?? [];

  return (
    <section className="dispatch-batch-page">
      {notice ? (
        <div className="toast-message success" role="status">
          {notice}
          <button type="button" onClick={() => setNotice("")}>x</button>
        </div>
      ) : null}
      {error ? <div className="toast-message error">{error}</div> : null}

      <div className="dispatch-batch-title-row">
        <div>
          <p className="eyebrow">Request Dispatch</p>
          <h1>{batchCode ? `Dispatch Batch ${batchCode}` : "Dispatch Batches"}</h1>
          <p>{batchCode ? "Item-level send progress and errors." : "Every single or multi-send request is tracked here."}</p>
        </div>
        <div className="dispatch-batch-actions">
          {batchCode ? (
            <button className="secondary-button compact" type="button" onClick={() => navigate("/requests/dispatch-batches")}>
              <ArrowLeft size={14} /> Batch List
            </button>
          ) : (
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="ALL">All statuses</option>
              <option value="QUEUED">Queued</option>
              <option value="PROCESSING">Processing</option>
              <option value="COMPLETED">Completed</option>
              <option value="COMPLETED_WITH_ERRORS">Completed with errors</option>
              <option value="FAILED">Failed</option>
            </select>
          )}
          <button className="secondary-button compact" type="button" onClick={() => (batchCode ? void loadDetail() : void loadList())}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {batchCode ? (
        <>
          <div className="dispatch-batch-kpis">
            <div><strong>{numberValue(batch?.totalItems)}</strong><span>Total</span></div>
            <div><strong>{numberValue(batch?.queuedItems)}</strong><span>Queued</span></div>
            <div><strong>{numberValue(batch?.processingItems)}</strong><span>Processing</span></div>
            <div><strong>{numberValue(batch?.succeededItems)}</strong><span>Succeeded</span></div>
            <div><strong>{numberValue(batch?.failedItems)}</strong><span>Failed</span></div>
          </div>
          <div className="dispatch-batch-panel">
            <div className="dispatch-batch-panel-head">
              <div>
                <strong>{textValue(batch?.batchName, "Dispatch batch")}</strong>
                <span>{formatDateTime(batch?.createdAt)} · {labelStatus(batch?.batchStatus)}</span>
              </div>
              {isActiveStatus(batch) ? <span className="status-pill warning"><Clock3 size={13} /> Running</span> : null}
            </div>
            <div className="dispatch-batch-table-scroll">
              <table className="dispatch-batch-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Dispatch Item</th>
                    <th>Source</th>
                    <th>Period</th>
                    <th>Status</th>
                    <th>Run</th>
                    <th>Error</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((item) => {
                    const label = itemDispatchLabel(item);
                    const runCode = itemRunCode(item);
                    return (
                      <tr key={textValue(item.itemId) || `${item.itemSequence}-${item.dispatchPlanCode}`}>
                        <td>{item.itemSequence}</td>
                        <td>
                          <strong>{label.indicator}</strong>
                          <span>{label.template}</span>
                          <small>{label.label}</small>
                        </td>
                        <td>
                          <strong>{label.ministry}</strong>
                          <span>{label.department}</span>
                        </td>
                        <td>{itemPeriod(item) || "-"}</td>
                        <td>
                          <span className={`status-pill ${textValue(item.itemStatus).toLowerCase()}`}>
                            {textValue(item.itemStatus).toUpperCase() === "SUCCEEDED" ? <CheckCircle2 size={13} /> : null}
                            {textValue(item.itemStatus).toUpperCase() === "FAILED" ? <XCircle size={13} /> : null}
                            {labelStatus(item.itemStatus)}
                          </span>
                        </td>
                        <td>
                          {runCode ? (
                            <button
                              className="secondary-button compact"
                              type="button"
                              onClick={() => navigate(`/requests/dispatch-runs/${encodeURIComponent(runCode)}`)}
                            >
                              <ExternalLink size={13} /> View
                            </button>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td>{textValue(item.errorMessage, "-")}</td>
                      </tr>
                    );
                  })}
                  {!currentItems.length ? (
                    <tr>
                      <td colSpan={7}>{isLoading ? "Loading batch items..." : "No batch items found."}</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="dispatch-batch-kpis">
            <div><strong>{batches.length}</strong><span>Total Batches</span></div>
            <div><strong>{statusCounts.QUEUED ?? 0}</strong><span>Queued</span></div>
            <div><strong>{statusCounts.PROCESSING ?? 0}</strong><span>Processing</span></div>
            <div><strong>{statusCounts.COMPLETED ?? 0}</strong><span>Completed</span></div>
            <div><strong>{(statusCounts.FAILED ?? 0) + (statusCounts.COMPLETED_WITH_ERRORS ?? 0)}</strong><span>Needs Attention</span></div>
          </div>
          <div className="dispatch-batch-list">
            {batches.map((item) => (
              <button
                className="dispatch-batch-list-item"
                key={item.batchCode}
                type="button"
                onClick={() => navigate(`/requests/dispatch-batches/${encodeURIComponent(textValue(item.batchCode))}`)}
              >
                <Send size={16} />
                <span>
                  <strong>{textValue(item.batchName, textValue(item.batchCode, "Dispatch batch"))}</strong>
                  <small>{textValue(item.batchCode)} · {formatDateTime(item.createdAt)}</small>
                </span>
                <em className={`status-pill ${textValue(item.batchStatus).toLowerCase()}`}>{labelStatus(item.batchStatus)}</em>
                <b>{numberValue(item.succeededItems)}/{numberValue(item.totalItems)}</b>
              </button>
            ))}
            {!batches.length ? <div className="empty-state">{isLoading ? "Loading batches..." : "No dispatch batches yet."}</div> : null}
          </div>
        </>
      )}
    </section>
  );
}
