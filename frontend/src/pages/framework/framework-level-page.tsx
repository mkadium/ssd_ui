import { ExternalLink, Grid2X2, List, RefreshCw, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  getFrameworkHierarchy,
  listFrameworkIndicatorMappingsByNode,
  listFrameworkEditions,
  type FrameworkIndicatorMappingSummary,
  type FrameworkHierarchy,
  type FrameworkLevel,
  type FrameworkNode,
} from "../../api/framework.api";
import { getSelectedUnitCode, LOCALE_CHANGED_EVENT, UNIT_CHANGED_EVENT } from "../../api/session.api";

type ViewMode = "grid" | "list";

const fallbackColors = [
  "#e91e3a",
  "#e2aa32",
  "#43a037",
  "#c8102e",
  "#ff3b25",
  "#27b8d4",
  "#f7c400",
  "#a41545",
  "#ff681f",
  "#d91772",
  "#f59e22",
  "#bd8d2b",
];

function pluralizeLabel(label?: string) {
  const safeLabel = (label || "Nodes").trim();
  if (!safeLabel) return "Nodes";
  if (safeLabel.endsWith("s")) return safeLabel;
  if (safeLabel.endsWith("y")) return `${safeLabel.slice(0, -1)}ies`;
  return `${safeLabel}s`;
}

function formatNodeNumber(node: FrameworkNode, index: number) {
  const rawNumber = node.node_number?.trim();
  if (rawNumber && /^\d+$/.test(rawNumber) && rawNumber.length === 1) {
    return rawNumber.padStart(2, "0");
  }
  return rawNumber || String(index + 1).padStart(2, "0");
}

function getNodeTitle(node: FrameworkNode) {
  return node.name || node.short_name || node.node_code;
}

function getNodeColor(node: FrameworkNode, index: number) {
  const value = node.color_value?.trim();
  if (value && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)) {
    return value;
  }
  return fallbackColors[index % fallbackColors.length];
}

export function FrameworkLevelPage() {
  const { levelCode = "", nodeCode = "" } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const decodedLevelCode = decodeURIComponent(levelCode);
  const decodedNodeCode = decodeURIComponent(nodeCode);
  const selectedChildCode = searchParams.get("selected") ?? "";
  const [hierarchy, setHierarchy] = useState<FrameworkHierarchy | null>(null);
  const [level, setLevel] = useState<FrameworkLevel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [parentFilter, setParentFilter] = useState("");

  useEffect(() => {
    void loadLevel();

    function handleContextChange() {
      void loadLevel();
    }

    window.addEventListener(UNIT_CHANGED_EVENT, handleContextChange);
    window.addEventListener(LOCALE_CHANGED_EVENT, handleContextChange);
    return () => {
      window.removeEventListener(UNIT_CHANGED_EVENT, handleContextChange);
      window.removeEventListener(LOCALE_CHANGED_EVENT, handleContextChange);
    };
  }, [decodedLevelCode]);

  const orderedLevels = useMemo(() => {
    return [...(hierarchy?.levels ?? [])]
      .filter((item) => item.is_active !== false)
      .sort((a, b) => Number(a.level_number ?? 0) - Number(b.level_number ?? 0));
  }, [hierarchy]);

  const nextLevel = useMemo(() => {
    if (!level) return null;
    return orderedLevels.find((item) => Number(item.level_number) > Number(level.level_number)) ?? null;
  }, [level, orderedLevels]);
  const parentLevel = useMemo(() => {
    if (!level) return null;
    const currentLevelNumber = Number(level.level_number);
    return [...orderedLevels]
      .reverse()
      .find((item) => Number(item.level_number) < currentLevelNumber) ?? null;
  }, [level, orderedLevels]);
  const isIndicatorMappingLevel = Boolean(level?.allows_indicator_mapping) || !nextLevel;

  const currentNodes = useMemo(() => {
    if (!hierarchy || !level) return [];
    return hierarchy.nodes
      .filter((node) => node.level_code === level.level_code && node.is_active !== false)
      .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0) || getNodeTitle(a).localeCompare(getNodeTitle(b)));
  }, [hierarchy, level]);

  const nodeByCode = useMemo(() => {
    return new Map((hierarchy?.nodes ?? []).map((node) => [node.node_code, node]));
  }, [hierarchy]);

  const childCodesByParent = useMemo(() => {
    const map = new Map<string, string[]>();
    (hierarchy?.relationships ?? [])
      .filter((relationship) => relationship.is_active !== false)
      .forEach((relationship) => {
        const childNode = nodeByCode.get(relationship.child_node_code);
        if (!childNode || childNode.is_active === false) return;
        if (nextLevel && childNode.level_code !== nextLevel.level_code) return;
        const children = map.get(relationship.parent_node_code) ?? [];
        children.push(relationship.child_node_code);
        map.set(relationship.parent_node_code, children);
      });
    return map;
  }, [hierarchy, nextLevel, nodeByCode]);

  const parentCodeByChild = useMemo(() => {
    const map = new Map<string, string>();
    (hierarchy?.relationships ?? [])
      .filter((relationship) => relationship.is_active !== false)
      .forEach((relationship) => {
        map.set(relationship.child_node_code, relationship.parent_node_code);
      });
    return map;
  }, [hierarchy]);

  const parentOptions = useMemo(() => {
    if (!parentLevel) return [];
    const parentCodes = new Set(currentNodes.map((node) => parentCodeByChild.get(node.node_code)).filter(Boolean));
    return [...parentCodes]
      .map((code) => nodeByCode.get(String(code)))
      .filter((node): node is FrameworkNode => Boolean(node))
      .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0) || getNodeTitle(a).localeCompare(getNodeTitle(b)));
  }, [currentNodes, nodeByCode, parentCodeByChild, parentLevel]);

  const filteredNodes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const parentFilteredNodes =
      isIndicatorMappingLevel && parentFilter
        ? currentNodes.filter((node) => parentCodeByChild.get(node.node_code) === parentFilter)
        : currentNodes;
    if (!normalizedQuery) return parentFilteredNodes;
    return parentFilteredNodes.filter((node) => {
      const values = [node.node_number, node.node_code, node.name, node.short_name, node.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return values.includes(normalizedQuery);
    });
  }, [currentNodes, isIndicatorMappingLevel, parentCodeByChild, parentFilter, query]);

  const totalChildCount = useMemo(() => {
    return new Set(currentNodes.flatMap((node) => childCodesByParent.get(node.node_code) ?? [])).size;
  }, [childCodesByParent, currentNodes]);

  const coveragePercent = useMemo(() => {
    if (!currentNodes.length || !nextLevel) return null;
    const withChildren = currentNodes.filter((node) => (childCodesByParent.get(node.node_code) ?? []).length > 0).length;
    return Math.round((withChildren / currentNodes.length) * 100);
  }, [childCodesByParent, currentNodes, nextLevel]);

  const totalIndicatorCount = useMemo(() => {
    return currentNodes.reduce((total, node) => total + Number(node.indicator_count ?? 0), 0);
  }, [currentNodes]);

  const nodesWithoutIndicators = useMemo(() => {
    return currentNodes.filter((node) => Number(node.indicator_count ?? 0) === 0).length;
  }, [currentNodes]);

  const parentCoveredCount = useMemo(() => {
    return new Set(
      currentNodes
        .filter((node) => Number(node.indicator_count ?? 0) > 0)
        .map((node) => parentCodeByChild.get(node.node_code))
        .filter(Boolean),
    ).size;
  }, [currentNodes, parentCodeByChild]);

  const levelLabel = pluralizeLabel(level?.name);
  const childLabel = nextLevel ? pluralizeLabel(nextLevel.name) : "Child nodes";
  const isChildListLevel = Number(level?.level_number ?? 1) > 1;
  const effectiveViewMode = isChildListLevel ? "list" : viewMode;
  const selectedNode = decodedNodeCode ? nodeByCode.get(decodedNodeCode) ?? null : null;
  const selectedNodeChildren = useMemo(() => {
    if (!selectedNode) return [];
    return (childCodesByParent.get(selectedNode.node_code) ?? [])
      .map((code) => nodeByCode.get(code))
      .filter((node): node is FrameworkNode => Boolean(node))
      .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0) || getNodeTitle(a).localeCompare(getNodeTitle(b)));
  }, [childCodesByParent, nodeByCode, selectedNode]);
  const activeChild = selectedNodeChildren.find((node) => node.node_code === selectedChildCode) ?? selectedNodeChildren[0] ?? null;

  async function loadLevel() {
    setIsLoading(true);
    setError("");
    try {
      const editionsResponse = await listFrameworkEditions(false);
      const editions = editionsResponse.data;
      const activeEdition = editions.find((edition) => edition.is_active !== false) ?? editions[0];
      if (!activeEdition?.framework_code) {
        setHierarchy(null);
        setLevel(null);
        setError("No active framework is available for the selected unit.");
        return;
      }

      const hierarchyResponse = await getFrameworkHierarchy(activeEdition.framework_code, activeEdition.edition_code);
      const nextHierarchy = hierarchyResponse.data;
      const nextLevelForRoute =
        nextHierarchy.levels.find((item) => item.level_code === decodedLevelCode) ??
        nextHierarchy.levels.find((item) => String(item.level_number) === decodedLevelCode);

      setHierarchy(nextHierarchy);
      setLevel(nextLevelForRoute ?? null);
      setParentFilter("");
      if (!nextLevelForRoute) {
        setError("This framework level is not available for the selected unit.");
      }
    } catch {
      setHierarchy(null);
      setLevel(null);
      setError("Framework level could not be loaded. Please refresh or try again later.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleOpenNode(node: FrameworkNode) {
    if (!level) return;
    if (Number(level.level_number) <= 1) {
      navigate(`/framework/levels/${encodeURIComponent(level.level_code)}/${encodeURIComponent(node.node_code)}`);
      return;
    }
    const parentCode = parentCodeByChild.get(node.node_code);
    const parentNode = parentCode ? nodeByCode.get(parentCode) : null;
    const parentLevel = parentNode ? hierarchy?.levels.find((item) => item.level_code === parentNode.level_code) : null;
    if (parentNode && parentLevel) {
      navigate(
        `/framework/levels/${encodeURIComponent(parentLevel.level_code)}/${encodeURIComponent(parentNode.node_code)}?selected=${encodeURIComponent(node.node_code)}`,
      );
      return;
    }
    navigate(`/framework/levels/${encodeURIComponent(level.level_code)}/${encodeURIComponent(node.node_code)}`);
  }

  if (selectedNode && level && hierarchy) {
    return (
      <FrameworkNodeDetailView
        childLabel={childLabel}
        childrenNodes={selectedNodeChildren}
        level={level}
        nextLevel={nextLevel}
        node={selectedNode}
        selectedChild={activeChild}
        onBack={() => navigate(`/framework/levels/${encodeURIComponent(level.level_code)}`)}
        onSelectChild={(child) =>
          navigate(
            `/framework/levels/${encodeURIComponent(level.level_code)}/${encodeURIComponent(selectedNode.node_code)}?selected=${encodeURIComponent(child.node_code)}`,
          )
        }
      />
    );
  }

  return (
    <div className="workflow-page framework-level-page">
      <section className="page-heading-row compact">
        <div>
          <div className="breadcrumb">Home / Framework / {level?.name ?? "Level"}</div>
          <h2>
            {getSelectedUnitCode()} {levelLabel}
          </h2>
          <p>
            Browse {levelLabel.toLowerCase()} from the selected unit framework hierarchy. Labels and records are loaded
            from the active framework edition.
          </p>
        </div>
        <div className="page-actions">
          <button className="secondary-button compact" type="button" onClick={() => void loadLevel()}>
            <RefreshCw size={13} />
            Refresh
          </button>
        </div>
      </section>

      {error && <div className="notice error">{error}</div>}
      {notice && <div className="notice success">{notice}</div>}

      <section className="metric-grid four">
        <article className="metric-card compact-metric-card">
          <div className="metric-value">{currentNodes.length}</div>
          <div className="metric-label">{levelLabel}</div>
          <div className="metric-sublabel">{currentNodes.length} active</div>
        </article>
        {isIndicatorMappingLevel ? (
          <>
            <article className="metric-card compact-metric-card">
              <div className="metric-value">{parentCoveredCount}</div>
              <div className="metric-label">{parentLevel ? `${pluralizeLabel(parentLevel.name)} covered` : "Parents covered"}</div>
              <div className="metric-sublabel">mapped indicators</div>
            </article>
            <article className="metric-card compact-metric-card">
              <div className="metric-value">{nodesWithoutIndicators}</div>
              <div className="metric-label">{levelLabel} without indicators</div>
              <div className="metric-sublabel">needs mapping</div>
            </article>
            <article className="metric-card compact-metric-card">
              <div className="metric-value">{totalIndicatorCount}</div>
              <div className="metric-label">Indicators</div>
              <div className="metric-sublabel">mapped to this level</div>
            </article>
          </>
        ) : (
          <>
            <article className="metric-card compact-metric-card">
              <div className="metric-value">{totalChildCount}</div>
              <div className="metric-label">{childLabel}</div>
              <div className="metric-sublabel">{nextLevel?.name ?? "available"}</div>
            </article>
            <article className="metric-card compact-metric-card">
              <div className="metric-value">{totalIndicatorCount}</div>
              <div className="metric-label">Indicators</div>
              <div className="metric-sublabel">mapped under {level?.name ?? "level"}</div>
            </article>
            <article className="metric-card compact-metric-card">
              <div className="metric-value">{coveragePercent === null ? "--" : `${coveragePercent}%`}</div>
              <div className="metric-label">{nextLevel ? `${childLabel} coverage` : "Coverage"}</div>
              <div className="metric-sublabel">{coveragePercent === null ? "pending" : "computed"}</div>
            </article>
          </>
        )}
      </section>

      <section className="framework-level-toolbar">
        <label className="search-box framework-level-search">
          <Search size={15} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search ${levelLabel.toLowerCase()} by number, name, or code`}
          />
        </label>
        {isIndicatorMappingLevel && parentOptions.length > 0 && (
          <select
            className="compact-select framework-parent-filter"
            value={parentFilter}
            onChange={(event) => setParentFilter(event.target.value)}
            aria-label={`Filter by ${parentLevel?.name ?? "parent"}`}
          >
            <option value="">All {pluralizeLabel(parentLevel?.name)}</option>
            {parentOptions.map((node) => (
              <option value={node.node_code} key={node.node_code}>
                {node.node_number ? `${node.node_number} - ` : ""}
                {getNodeTitle(node)}
              </option>
            ))}
          </select>
        )}
        {!isChildListLevel && <div className="level-view-toggle" aria-label="View mode">
          <button
            className={viewMode === "grid" ? "active" : ""}
            type="button"
            onClick={() => setViewMode("grid")}
            aria-pressed={viewMode === "grid"}
          >
            <Grid2X2 size={14} />
            Grid
          </button>
          <button
            className={viewMode === "list" ? "active" : ""}
            type="button"
            onClick={() => setViewMode("list")}
            aria-pressed={viewMode === "list"}
          >
            <List size={15} />
            List
          </button>
        </div>}
      </section>

      <section className="framework-level-content">
        {isLoading ? (
          <div className="empty-state">Loading framework level...</div>
        ) : filteredNodes.length === 0 ? (
          <div className="empty-state">No {levelLabel.toLowerCase()} found for the selected filters.</div>
        ) : effectiveViewMode === "grid" ? (
          <div className="level-node-grid">
            {filteredNodes.map((node, index) => {
              const childCount = (childCodesByParent.get(node.node_code) ?? []).length;
              const indicatorCount = Number(node.indicator_count ?? 0);
              const color = getNodeColor(node, index);
              return (
                <article className="level-node-card" key={node.node_code}>
                  <div className="level-node-card-header" style={{ backgroundColor: color }}>
                    <span>{formatNodeNumber(node, index)}</span>
                    <button
                      className="level-open-icon"
                      type="button"
                      title={`Open ${getNodeTitle(node)}`}
                      onClick={() => handleOpenNode(node)}
                    >
                      <ExternalLink size={14} />
                    </button>
                  </div>
                  <div className="level-node-card-body">
                    <h3 title={getNodeTitle(node)}>{getNodeTitle(node)}</h3>
                    <p title={node.description || node.node_code}>{node.description || node.node_code}</p>
                    <div className="level-node-stats">
                      <span>
                        <strong>{childCount}</strong>
                        {childLabel}
                      </span>
                      <span>
                        <strong>{indicatorCount}</strong>
                        Indicators
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="level-node-list">
            {filteredNodes.map((node, index) => {
              const childCount = (childCodesByParent.get(node.node_code) ?? []).length;
              const indicatorCount = Number(node.indicator_count ?? 0);
              const parentCode = parentCodeByChild.get(node.node_code);
              const parentNode = parentCode ? nodeByCode.get(parentCode) : null;
              const color = getNodeColor(node, index);
              return (
                <article className="level-node-row" key={node.node_code}>
                  <div className="level-node-badge" style={{ backgroundColor: color }}>
                    {formatNodeNumber(node, index)}
                  </div>
                  <div className="level-node-row-main">
                    <h3 title={getNodeTitle(node)}>{getNodeTitle(node)}</h3>
                    <p title={node.node_code}>{node.node_code}</p>
                  </div>
                  {isIndicatorMappingLevel && parentNode ? (
                    <div className="level-node-row-stat parent-code-stat">
                      <strong>{parentNode.node_number ?? parentNode.node_code}</strong>
                      <span>{parentLevel?.name ?? "Parent"}</span>
                    </div>
                  ) : (
                    <div className="level-node-row-stat">
                      <strong>{childCount}</strong>
                      <span>{childLabel}</span>
                    </div>
                  )}
                  <div className="level-node-row-stat">
                    <strong>{indicatorCount}</strong>
                    <span>Indicators</span>
                  </div>
                  <button className="text-action" type="button" onClick={() => handleOpenNode(node)}>
                    Open <ExternalLink size={12} />
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function FrameworkNodeDetailView({
  node,
  level,
  nextLevel,
  childLabel,
  childrenNodes,
  selectedChild,
  onBack,
  onSelectChild,
}: {
  node: FrameworkNode;
  level: FrameworkLevel;
  nextLevel: FrameworkLevel | null;
  childLabel: string;
  childrenNodes: FrameworkNode[];
  selectedChild: FrameworkNode | null;
  onBack: () => void;
  onSelectChild: (node: FrameworkNode) => void;
}) {
  const navigate = useNavigate();
  const color = getNodeColor(node, 0);
  const selectedColor = selectedChild ? getNodeColor(selectedChild, 1) : color;
  const nodeIndicatorCount = Number(node.indicator_count ?? 0);
  const childrenWithoutIndicators = childrenNodes.filter((child) => Number(child.indicator_count ?? 0) === 0).length;
  const [mappedIndicators, setMappedIndicators] = useState<FrameworkIndicatorMappingSummary[]>([]);
  const [isLoadingIndicators, setIsLoadingIndicators] = useState(false);

  useEffect(() => {
    if (!selectedChild?.node_code) {
      setMappedIndicators([]);
      return;
    }
    let isMounted = true;
    setIsLoadingIndicators(true);
    listFrameworkIndicatorMappingsByNode(selectedChild.node_code)
      .then((response) => {
        if (isMounted) setMappedIndicators(response.data);
      })
      .catch(() => {
        if (isMounted) setMappedIndicators([]);
      })
      .finally(() => {
        if (isMounted) setIsLoadingIndicators(false);
      });
    return () => {
      isMounted = false;
    };
  }, [selectedChild?.node_code]);

  return (
    <div className="workflow-page framework-node-detail-page">
      <div className="breadcrumb">Home / Framework / {pluralizeLabel(level.name)} / {getNodeTitle(node)}</div>
      <section className="framework-node-hero">
        <button className="secondary-button compact framework-node-back" type="button" onClick={onBack}>
          Back to {pluralizeLabel(level.name)}
        </button>
        <div className="framework-node-hero-main">
          <div className="framework-node-number" style={{ backgroundColor: color }}>
            <span>{level.name}</span>
            <strong>{formatNodeNumber(node, 0)}</strong>
          </div>
          <div>
            <h2>{getNodeTitle(node)}</h2>
            <div className="node-badges">
              <span>{childrenNodes.length} {childLabel}</span>
              <span>{nodeIndicatorCount} National Indicators</span>
              <span>{childrenWithoutIndicators} {childLabel} without indicators</span>
            </div>
          </div>
        </div>
      </section>

      <div className="framework-node-detail-grid">
        <section className="framework-node-child-list">
          <header>
            <h3>{childLabel}</h3>
            <p>Select a {nextLevel?.name ?? "child node"} to view associated national indicators.</p>
          </header>
          <div className="node-child-scroll">
            {childrenNodes.length ? (
              childrenNodes.map((child, index) => (
                <button
                  className={selectedChild?.node_code === child.node_code ? "node-child-card active" : "node-child-card"}
                  key={child.node_code}
                  type="button"
                  onClick={() => onSelectChild(child)}
                >
                  <span>{nextLevel?.name ?? "Child"} {child.node_number ?? index + 1}</span>
                  <strong>{getNodeTitle(child)}</strong>
                  <small>{Number(child.indicator_count ?? 0)} indicators</small>
                </button>
              ))
            ) : (
              <div className="empty-state">No child nodes available.</div>
            )}
          </div>
        </section>

        <section className="framework-node-indicator-panel">
          {selectedChild ? (
            <>
              <header style={{ borderColor: `${selectedColor}55`, background: `${selectedColor}10` }}>
                <span>{nextLevel?.name ?? "Selected"} {selectedChild.node_number}</span>
                <h3>{getNodeTitle(selectedChild)}</h3>
              </header>
              <div className="framework-node-indicator-list">
                {isLoadingIndicators ? (
                  <div className="empty-state">Loading mapped indicators...</div>
                ) : mappedIndicators.length ? (
                  mappedIndicators.map((indicator) => (
                    <button
                      className="framework-node-indicator-card clickable"
                      key={indicator.national_indicator_code}
                      type="button"
                      onClick={() =>
                        indicator.national_indicator_code &&
                        navigate(`/indicators/library?indicator=${encodeURIComponent(indicator.national_indicator_code)}`)
                      }
                    >
                      <span>{indicator.indicator_number ?? indicator.national_indicator_code}</span>
                      <strong>{indicator.indicator_name ?? indicator.national_indicator_code}</strong>
                      <div className="indicator-mini-meta">
                        <small>Mapping: {indicator.mapping_type ?? "PRIMARY"}</small>
                        <small>Status: {indicator.status ?? "ACTIVE"}</small>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="empty-state">No mapped indicators found for this node.</div>
                )}
              </div>
            </>
          ) : (
            <div className="empty-state">Select a child node to view indicators.</div>
          )}
        </section>
      </div>
    </div>
  );
}
