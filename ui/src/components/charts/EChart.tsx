import type { ECharts, EChartsCoreOption } from "echarts/core";
import { useEffect, useRef } from "react";

type EChartProps = {
  title: string;
  option: EChartsCoreOption;
  className?: string;
};

type EChartsCoreModule = typeof import("echarts/core");

let echartsLoader: Promise<EChartsCoreModule> | null = null;

function loadECharts() {
  echartsLoader ??= Promise.all([
    import("echarts/core"),
    import("echarts/charts"),
    import("echarts/components"),
    import("echarts/renderers"),
  ]).then(([core, charts, components, renderers]) => {
    core.use([
      charts.BarChart,
      charts.PieChart,
      components.GridComponent,
      components.LegendComponent,
      components.TooltipComponent,
      renderers.CanvasRenderer,
    ]);

    return core;
  });

  return echartsLoader;
}

export function EChart({ title, option, className }: EChartProps) {
  const chartRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let chart: ECharts | null = null;
    let cancelled = false;

    const resize = () => chart?.resize();

    loadECharts().then(({ init }) => {
      if (cancelled || !chartRef.current) return;

      chart = init(chartRef.current, undefined, {
        renderer: "canvas",
      });

      chart.setOption(option);
      window.addEventListener("resize", resize);
    });

    return () => {
      cancelled = true;
      window.removeEventListener("resize", resize);
      chart?.dispose();
    };
  }, [option]);

  return (
    <div
      ref={chartRef}
      aria-label={title}
      role="img"
      className={className}
    />
  );
}
