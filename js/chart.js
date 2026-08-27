import { fetchHistoricalData } from "./api.js";

let chart = null;
let areaSeries = null;
let currentPair = { from: "USD", to: "IDR" };
let currentTimeframe = "30D";
let resizeObserver = null;

export function initChart() {
  const container = document.getElementById("tvChartContainer");
  if (!container || !window.LightweightCharts) return;

  // Cleanup old chart if exists
  if (chart) {
    chart.remove();
    chart = null;
  }

  chart = window.LightweightCharts.createChart(container, {
    width: container.clientWidth,
    height: 220,
    layout: {
      background: { color: "transparent" },
      textColor: "#4a7a5a",
      fontFamily: "'Space Mono', monospace",
      fontSize: 10,
    },
    grid: {
      vertLines: { color: "rgba(30, 58, 47, 0.3)" },
      horzLines: { color: "rgba(30, 58, 47, 0.3)" },
    },
    rightPriceScale: {
      borderColor: "#1e3a2f",
      scaleMargins: { top: 0.15, bottom: 0.15 },
    },
    timeScale: {
      borderColor: "#1e3a2f",
      timeVisible: true,
      secondsVisible: false,
    },
    crosshair: {
      vertLine: {
        color: "#00ff88",
        width: 1,
        style: 3,
        labelBackgroundColor: "#111927",
      },
      horzLine: {
        color: "#00ff88",
        width: 1,
        style: 3,
        labelBackgroundColor: "#111927",
      },
    },
    handleScroll: {
      mouseWheel: true,
      pressedMouseMove: true,
      horzTouchDrag: true,
      vertTouchDrag: false,
    },
    handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
  });

  areaSeries = chart.addAreaSeries({
    topColor: "rgba(0, 255, 136, 0.35)",
    bottomColor: "rgba(0, 255, 136, 0.01)",
    lineColor: "#00ff88",
    lineWidth: 2,
    priceFormat: {
      type: "price",
      precision: 4,
      minMove: 0.0001,
    },
  });

  // Crosshair hover update
  chart.subscribeCrosshairMove((param) => {
    const tooltip = document.getElementById("chartTooltip");
    if (!tooltip) return;

    if (
      !param.time ||
      param.point.x < 0 ||
      param.point.x > container.clientWidth ||
      param.point.y < 0 ||
      param.point.y > 220
    ) {
      tooltip.style.display = "none";
      return;
    }

    const price = param.seriesData.get(areaSeries);
    if (price && price.value !== undefined) {
      tooltip.style.display = "block";
      const dec = price.value >= 1 ? 4 : 8;
      const formattedPrice = price.value.toLocaleString("en-US", {
        maximumFractionDigits: dec,
      });
      const dateStr = new Date(param.time * 1000).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: currentTimeframe === "24H" ? "2-digit" : undefined,
        minute: currentTimeframe === "24H" ? "2-digit" : undefined,
      });

      tooltip.innerHTML = `<span class="chart-tt-price">${formattedPrice}</span> <span class="chart-tt-date">${dateStr}</span>`;
    }
  });

  // Auto-resize on window / container resize
  if (resizeObserver) resizeObserver.disconnect();
  resizeObserver = new ResizeObserver((entries) => {
    if (entries[0] && chart) {
      chart.applyOptions({ width: entries[0].contentRect.width });
    }
  });
  resizeObserver.observe(container);
}

export async function updateChart(from, to, timeframe = currentTimeframe) {
  currentPair = { from, to };
  currentTimeframe = timeframe;

  const chartStatus = document.getElementById("chartStatus");
  if (chartStatus) chartStatus.textContent = "MEMUAT DATA TREN...";

  if (!chart) initChart();

  try {
    const data = await fetchHistoricalData(from, to, timeframe);
    if (data && data.length && areaSeries) {
      // Sort chronologically
      data.sort((a, b) => a.time - b.time);

      // Auto precision setting
      const latestVal = data[data.length - 1].value;
      const precision = latestVal >= 100 ? 2 : latestVal >= 1 ? 4 : 8;
      const minMove =
        latestVal >= 100 ? 0.01 : latestVal >= 1 ? 0.0001 : 0.00000001;

      areaSeries.applyOptions({
        priceFormat: {
          type: "price",
          precision: precision,
          minMove: minMove,
        },
      });

      // Calculate trend for chart color (Green if Up, Red if Down)
      const firstVal = data[0].value;
      const isPositive = latestVal >= firstVal;
      const changePct =
        firstVal !== 0
          ? (((latestVal - firstVal) / firstVal) * 100).toFixed(2)
          : 0;

      areaSeries.applyOptions({
        lineColor: isPositive ? "#00ff88" : "#ff4466",
        topColor: isPositive
          ? "rgba(0, 255, 136, 0.35)"
          : "rgba(255, 68, 102, 0.35)",
        bottomColor: isPositive
          ? "rgba(0, 255, 136, 0.01)"
          : "rgba(255, 68, 102, 0.01)",
      });

      areaSeries.setData(data);
      chart.timeScale().fitContent();

      // Update 24h / Period stats
      const statsChange = document.getElementById("statsChange");
      const statsHigh = document.getElementById("statsHigh");
      const statsLow = document.getElementById("statsLow");

      const prices = data.map((d) => d.value);
      const high = Math.max(...prices);
      const low = Math.min(...prices);

      if (statsChange) {
        statsChange.textContent = `${isPositive ? "+" : ""}${changePct}%`;
        statsChange.className = `stat-badge ${isPositive ? "stat-badge--up" : "stat-badge--down"}`;
      }
      if (statsHigh)
        statsHigh.textContent = high.toLocaleString("en-US", {
          maximumFractionDigits: precision,
        });
      if (statsLow)
        statsLow.textContent = low.toLocaleString("en-US", {
          maximumFractionDigits: precision,
        });
      if (chartStatus) chartStatus.textContent = `${from}/${to} · ${timeframe}`;
    }
  } catch (err) {
    console.error("Error updating chart", err);
    if (chartStatus) chartStatus.textContent = "DATA GRAFIK GAGAL DIMUAT";
  }
}
