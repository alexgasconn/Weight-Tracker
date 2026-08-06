from datetime import datetime, date
from typing import List, Sequence

import matplotlib.dates as mdates
import matplotlib.pyplot as plt

try:
    import plotly.graph_objects as go
    _HAS_PLOTLY = True
except Exception:
    _HAS_PLOTLY = False


def plot_bmi_matplotlib(dates: Sequence[date], bmi: Sequence[float], *,
                        title: str = "BMI over time",
                        figsize=(10, 5),
                        save_path: str | None = None,
                        show: bool = True):
    """Plot BMI time series with horizontal colored bands for categories.

    Categories:
      - Underweight: < 18.5 (blue)
      - Normal: 18.5–25 (green)
      - Overweight: 25–30 (orange)
      - Obesity: > 30 (red)
    """
    fig, ax = plt.subplots(figsize=figsize)

    # Setup y-limits to cover categories and data comfortably
    y_min = min(min(bmi) - 2, 12)
    y_max = max(max(bmi) + 2, 40)

    # Draw horizontal bands
    bands = [
        (y_min, 18.5, "#a6cee3"),  # blue-ish
        (18.5, 25, "#b2df8a"),
        (25, 30, "#ffcc80"),
        (30, y_max, "#fb9a99"),
    ]
    for y0, y1, color in bands:
        ax.axhspan(y0, y1, color=color, alpha=0.4)

    # Plot line
    ax.plot(dates, bmi, marker="o", color="#1f78b4", linewidth=2, label="IMC")

    # Format x-axis as dates
    ax.xaxis.set_major_locator(mdates.AutoDateLocator())
    ax.xaxis.set_major_formatter(mdates.DateFormatter("%Y-%m-%d"))
    fig.autofmt_xdate()

    ax.set_ylim(y_min, y_max)
    ax.set_ylabel("IMC")
    ax.set_xlabel("Fecha")
    ax.set_title(title)
    ax.grid(alpha=0.3)
    ax.legend()

    if save_path:
        fig.savefig(save_path, bbox_inches="tight", dpi=150)
    if show:
        plt.show()
    plt.close(fig)


def plot_bmi_plotly(dates: Sequence[date], bmi: Sequence[float], *,
                    title: str = "BMI over time",
                    save_html: str | None = None):
    """Alternative interactive plot using Plotly (if available)."""
    if not _HAS_PLOTLY:
        raise RuntimeError("plotly is not installed")

    # Convert dates to ISO strings for plotly
    x = [d.isoformat() if isinstance(d, (date, datetime)) else d for d in dates]

    shapes = [
        dict(type="rect", xref="paper", x0=0, x1=1, yref="y", y0=-100, y1=18.5, fillcolor="#a6cee3", opacity=0.4, layer="below", line_width=0),
        dict(type="rect", xref="paper", x0=0, x1=1, yref="y", y0=18.5, y1=25, fillcolor="#b2df8a", opacity=0.4, layer="below", line_width=0),
        dict(type="rect", xref="paper", x0=0, x1=1, yref="y", y0=25, y1=30, fillcolor="#ffcc80", opacity=0.4, layer="below", line_width=0),
        dict(type="rect", xref="paper", x0=0, x1=1, yref="y", y0=30, y1=100, fillcolor="#fb9a99", opacity=0.4, layer="below", line_width=0),
    ]

    fig = go.Figure()
    fig.add_trace(go.Scatter(x=x, y=bmi, mode="lines+markers", name="IMC", line=dict(color="#1f78b4")))
    fig.update_layout(shapes=shapes, title=title, xaxis_title="Fecha", yaxis_title="IMC")

    if save_html:
        fig.write_html(save_html)
    else:
        fig.show()


def _sample_data():
    # Simple sample dataset
    dates = [
        date(2026, 1, 5),
        date(2026, 1, 20),
        date(2026, 2, 4),
        date(2026, 2, 18),
        date(2026, 3, 5),
        date(2026, 3, 20),
        date(2026, 4, 4),
    ]
    bmi = [17.8, 18.3, 19.6, 24.2, 26.1, 28.7, 31.4]
    return dates, bmi


if __name__ == "__main__":
    dates, bmi = _sample_data()
    # Matplotlib example (shows GUI and/or saves)
    plot_bmi_matplotlib(dates, bmi, title="Ejemplo IMC — Matplotlib", save_path="bmi_matplotlib.png")

    # Plotly example (writes interactive HTML) — only if plotly installed
    if _HAS_PLOTLY:
        plot_bmi_plotly(dates, bmi, title="Ejemplo IMC — Plotly", save_html="bmi_plotly.html")
