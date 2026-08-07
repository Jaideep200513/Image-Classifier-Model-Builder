"use client";

import { useEffect, useState } from "react";
import { X, ArrowLeftRight, HelpCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { UnderTheHoodAnalytics, EpochMetric } from "@/types";

interface UnderTheHoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
}

const DEFAULT_PROJECT_ID = "default-project";

function InfoTooltip({ title, description }: { title: string; description: string }) {
  const [show, setShow] = useState(false);

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <HelpCircle className="h-4 w-4 text-slate-400 hover:text-slate-600 cursor-help transition-colors" />
      {show && (
        <div className="absolute left-0 top-full mt-2 z-50 w-72 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-2xl pointer-events-none leading-relaxed transition-all animate-in fade-in-50 zoom-in-95">
          <p className="font-bold text-white mb-1 border-b border-slate-700/80 pb-1">{title}</p>
          <p className="text-slate-200 font-normal">{description}</p>
          <div className="absolute bottom-full left-4 border-4 border-transparent border-b-slate-900" />
        </div>
      )}
    </div>
  );
}

export default function UnderTheHoodModal({
  isOpen,
  onClose,
  projectId = DEFAULT_PROJECT_ID,
}: UnderTheHoodModalProps) {
  const [data, setData] = useState<UnderTheHoodAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    api
      .getUnderTheHood(projectId)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setError(null);
          setIsLoading(false);
        }
      })
      .catch((err: Error) => {
        if (isMounted) {
          setError(err.message || "Failed to load performance analytics");
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, projectId]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto cursor-pointer"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh] cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 bg-white">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-slate-900">Under the hood</h2>
            <ArrowLeftRight className="h-5 w-5 text-slate-700 stroke-[2]" />
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Intro Description */}
          <div className="text-sm text-slate-700 leading-relaxed">
            <p>Here are a few graphs that can help you understand how well your model is working.</p>
          </div>

          {isLoading ? (
            <div className="flex h-48 items-center justify-center text-sm text-slate-500 gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
              Loading analytics graphs...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
              {error}
            </div>
          ) : data ? (
            <div className="space-y-6">
              {/* 1. Accuracy per epoch Chart */}
              <LineChartCard
                title="Accuracy per epoch"
                tooltipTitle="Accuracy"
                tooltipDesc="Accuracy is the percentage of classifications that a model gets right during training. If your model classifies 70 samples right out of 100, the accuracy is 70 / 100 = 0.7."
                yTitle="Accuracy"
                data={data.accuracy_per_epoch}
                y1Key="accuracy"
                y1Label="acc"
                y2Key="val_accuracy"
                y2Label="test"
                yMin={0}
                yMax={1.0}
              />

              {/* 2. Loss per epoch Chart */}
              <LineChartCard
                title="Loss per epoch"
                tooltipTitle="Loss"
                tooltipDesc="Loss measures how far the model's predictions are from the true labels. Lower loss values mean better model predictions and performance."
                yTitle="Loss"
                data={data.loss_per_epoch}
                y1Key="loss"
                y1Label="loss"
                y2Key="val_loss"
                y2Label="test loss"
                yMin={0}
                yMax={Math.max(
                  0.6,
                  ...data.loss_per_epoch.map((d) => Math.max(d.loss || 0, d.val_loss || 0))
                )}
              />

              {/* 3. Accuracy per class Table */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-semibold text-blue-600">Accuracy per class</h3>
                  <InfoTooltip
                    title="Accuracy per Class"
                    description="Displays the breakdown of classification accuracy and total evaluated sample count for each specific class category."
                  />
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-900">
                      <tr>
                        <th className="px-4 py-2.5">CLASS</th>
                        <th className="px-4 py-2.5">ACCURACY</th>
                        <th className="px-4 py-2.5"># SAMPLES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {data.accuracy_per_class.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-4 py-2 font-semibold font-sans text-slate-900">{item.class_name}</td>
                          <td className="px-4 py-2 text-slate-800">{item.accuracy.toFixed(2)}</td>
                          <td className="px-4 py-2 text-slate-600">{item.sample_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. Confusion Matrix Grid */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-semibold text-blue-600">Confusion Matrix</h3>
                  <InfoTooltip
                    title="Confusion Matrix"
                    description="A matrix comparing the true class labels against predicted class labels to visualize where the model makes correct predictions or gets confused."
                  />
                </div>

                <ConfusionMatrixView data={data.confusion_matrix} />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function LineChartCard({
  title,
  tooltipTitle,
  tooltipDesc,
  yTitle,
  data,
  y1Key,
  y1Label,
  y2Key,
  y2Label,
  yMin = 0,
  yMax = 1,
}: {
  title: string;
  tooltipTitle: string;
  tooltipDesc: string;
  yTitle: string;
  data: EpochMetric[];
  y1Key: keyof EpochMetric;
  y1Label: string;
  y2Key: keyof EpochMetric;
  y2Label: string;
  yMin?: number;
  yMax?: number;
}) {
  const width = 360;
  const height = 180;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 15;
  const paddingBottom = 30;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const maxEpoch = Math.max(1, ...data.map((d) => d.epoch));

  const getX = (epoch: number) => paddingLeft + ((epoch - 1) / Math.max(1, maxEpoch - 1)) * chartW;
  const getY = (val: number) => {
    const clamped = Math.max(yMin, Math.min(yMax, val));
    const ratio = (clamped - yMin) / (yMax - yMin || 1);
    return paddingTop + chartH - ratio * chartH;
  };

  const points1 = data.map((d) => `${getX(d.epoch)},${getY(d[y1Key] ?? 0)}`).join(" ");
  const points2 = data.map((d) => `${getX(d.epoch)},${getY(d[y2Key] ?? 0)}`).join(" ");

  // Y-axis ticks (4 ticks)
  const step = (yMax - yMin) / 4 || 0.25;
  const yTicks = [yMin, yMin + step, yMin + 2 * step, yMin + 3 * step, yMax];

  // X-axis ticks (deduplicated & sorted)
  const xTicks = Array.from(new Set([0, 10, 20, 30, 40, maxEpoch]))
    .filter((v) => v <= maxEpoch)
    .sort((a, b) => a - b);

  return (
    <div className="space-y-2 border-b border-slate-100 pb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <h3 className="text-base font-semibold text-blue-600">{title}</h3>
          <InfoTooltip title={tooltipTitle} description={tooltipDesc} />
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-blue-600 inline-block"></span>
            <span className="text-slate-700">— {y1Label}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-amber-600 inline-block"></span>
            <span className="text-slate-700">— {y2Label}</span>
          </div>
        </div>
      </div>

      <div className="relative border rounded-lg bg-white p-3 shadow-2xs overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          {/* Grid lines */}
          {yTicks.map((tick, i) => (
            <line
              key={`y-grid-${i}`}
              x1={paddingLeft}
              y1={getY(tick)}
              x2={width - paddingRight}
              y2={getY(tick)}
              stroke="#e2e8f0"
              strokeWidth="1"
            />
          ))}

          {/* Y Axis Labels */}
          {yTicks.map((tick, i) => (
            <text
              key={`y-label-${i}`}
              x={paddingLeft - 6}
              y={getY(tick) + 3}
              fontSize="9"
              fill="#64748b"
              textAnchor="end"
            >
              {tick < 1 ? tick.toFixed(1) : Math.round(tick)}
            </text>
          ))}

          {/* X Axis Labels */}
          {xTicks.map((epoch, idx) => (
            <text
              key={`x-label-${epoch}-${idx}`}
              x={epoch === 0 ? paddingLeft : getX(epoch)}
              y={height - paddingBottom + 14}
              fontSize="9"
              fill="#64748b"
              textAnchor="middle"
            >
              {epoch}
            </text>
          ))}

          {/* X Axis Title */}
          <text
            x={paddingLeft + chartW / 2}
            y={height - 2}
            fontSize="10"
            fontWeight="bold"
            fill="#1e293b"
            textAnchor="middle"
          >
            Epochs
          </text>

          {/* Y Axis Title */}
          <text
            x={-(paddingTop + chartH / 2)}
            y="12"
            transform="rotate(-90)"
            fontSize="10"
            fontWeight="bold"
            fill="#1e293b"
            textAnchor="middle"
          >
            {yTitle}
          </text>

          {/* Line 1 (Train) */}
          <polyline fill="none" stroke="#2563eb" strokeWidth="2" points={points1} />

          {/* Line 2 (Val/Test) */}
          <polyline fill="none" stroke="#d97706" strokeWidth="2" points={points2} />
        </svg>
      </div>
    </div>
  );
}

function ConfusionMatrixView({ data }: { data: { classes: string[]; matrix: number[][] } }) {
  const { classes, matrix } = data;
  const maxVal = Math.max(1, ...matrix.flat());

  return (
    <div className="flex items-center gap-4">
      {/* Matrix Table Container */}
      <div className="flex-1 space-y-2">
        <div className="flex items-center">
          {/* Vertical Y axis title "Class" */}
          <div className="text-xs font-bold text-slate-800 -rotate-90 pr-2 whitespace-nowrap">
            Class
          </div>

          <div className="flex-1">
            {/* Grid */}
            <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
              <div
                className="grid gap-px bg-slate-200 p-px"
                style={{
                  gridTemplateColumns: `auto repeat(${classes.length}, minmax(0, 1fr))`,
                }}
              >
                {/* Empty top-left cell */}
                <div className="bg-white p-2"></div>

                {/* Top Column headers (Prediction labels) */}
                {classes.map((cls, idx) => (
                  <div
                    key={`col-${idx}`}
                    className="bg-white text-center text-xs font-semibold text-slate-800 py-2 px-1 truncate"
                    title={cls}
                  >
                    {cls}
                  </div>
                ))}

                {/* Matrix Rows */}
                {classes.map((rowCls, rIdx) => (
                  <div key={`row-group-${rIdx}`} className="contents">
                    {/* Row Label (True Class) */}
                    <div
                      className="bg-white flex items-center px-2 py-3 text-xs font-semibold text-slate-800 truncate"
                      title={rowCls}
                    >
                      {rowCls}
                    </div>

                    {/* Matrix Cells */}
                    {classes.map((_, cIdx) => {
                      const count = matrix[rIdx]?.[cIdx] || 0;
                      const intensity = count / maxVal;
                      const isHigh = intensity > 0.5;

                      return (
                        <div
                          key={`cell-${rIdx}-${cIdx}`}
                          className="flex items-center justify-center font-mono font-bold text-xs p-3 transition-colors"
                          style={{
                            backgroundColor: count > 0 ? `rgba(59, 130, 246, ${0.15 + intensity * 0.75})` : "#ffffff",
                            color: isHigh ? "#ffffff" : count > 0 ? "#1e3a8a" : "#94a3b8",
                          }}
                        >
                          {count}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom X axis title "Prediction" */}
            <p className="text-center text-xs font-bold text-slate-800 mt-2">
              Prediction
            </p>
          </div>
        </div>
      </div>

      {/* Right Color Scale Legend Bar */}
      <div className="flex flex-col items-center gap-1 text-[10px] font-mono text-slate-600">
        <span className="font-sans font-semibold text-slate-700">scaleCount</span>
        <span className="font-bold text-slate-900">{maxVal}</span>
        <div className="w-4 h-24 rounded border border-slate-200 bg-gradient-to-t from-blue-50 to-blue-600"></div>
        <span>0</span>
      </div>
    </div>
  );
}
