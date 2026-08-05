"use client";

import { useState } from "react";
import { Cpu, Play, Settings2, CheckCircle2, AlertCircle, Loader2, RotateCcw, XCircle, ArrowLeftRight } from "lucide-react";
import { motion } from "motion/react";
import { Input } from "@/components/ui/input";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { TrainingConfig, ImageClass } from "@/types";
import { useTraining } from "@/hooks/useTraining";
import UnderTheHoodModal from "./UnderTheHoodModal";

const DEFAULT_CONFIG: TrainingConfig = { epochs: 50, batchSize: 16, learningRate: 0.001 };

const FIELDS: { id: string; label: string; desc: string; field: keyof TrainingConfig; step: number }[] = [
  { id: "epochs-input",        label: "Epochs",        desc: "Passes through the dataset",    field: "epochs",       step: 1 },
  { id: "batch-size-input",    label: "Batch Size",    desc: "Samples per gradient step",     field: "batchSize",    step: 1 },
  { id: "learning-rate-input", label: "Learning Rate", desc: "Gradient descent step size",    field: "learningRate", step: 0.0001 },
];

interface TrainingPanelProps {
  classes?: ImageClass[];
}

export default function TrainingPanel({ classes = [] }: TrainingPanelProps) {
  const [config, setConfig] = useState<TrainingConfig>(DEFAULT_CONFIG);
  const [inputs, setInputs] = useState<{ epochs: string; batchSize: string; learningRate: string }>({
    epochs: "50",
    batchSize: "16",
    learningRate: "0.001",
  });
  const [accordionValue, setAccordionValue] = useState<string[]>([]);
  const [showUnderTheHoodModal, setShowUnderTheHoodModal] = useState(false);

  const {
    status,
    progress,
    currentEpoch,
    totalEpochs,
    formattedElapsedTime,
    metrics,
    error,
    hasTrainedModel,
    isTraining,
    isCancelling,
    startTraining,
    cancelTraining,
  } = useTraining();

  // Validation logic (Phase 3 requirements: >=2 enabled classes, each having >=10 images)
  const enabledClasses = classes.filter((c) => !c.disabled);
  const hasMinClasses = enabledClasses.length >= 2;

  const classesWithCounts = enabledClasses.map((c) => ({
    name: c.name,
    count: c.images?.length || c.imageCount || 0,
  }));

  const invalidClasses = classesWithCounts.filter((c) => c.count < 10);
  const allEnabledHaveEnoughImages = enabledClasses.length > 0 && invalidClasses.length === 0;
  const isValidDataset = hasMinClasses && allEnabledHaveEnoughImages;

  function handleInputChange(field: keyof TrainingConfig, rawValue: string) {
    setInputs((prev) => ({ ...prev, [field]: rawValue }));
    const parsed = parseFloat(rawValue);
    if (!isNaN(parsed) && parsed > 0) {
      setConfig((prev) => ({ ...prev, [field]: parsed }));
    }
  }

  function handleInputBlur(field: keyof TrainingConfig) {
    const parsed = parseFloat(inputs[field]);
    if (isNaN(parsed) || parsed <= 0) {
      const defaultVal = DEFAULT_CONFIG[field];
      setInputs((prev) => ({ ...prev, [field]: String(defaultVal) }));
      setConfig((prev) => ({ ...prev, [field]: defaultVal }));
    }
  }

  function handleResetDefaults() {
    setConfig(DEFAULT_CONFIG);
    setInputs({
      epochs: String(DEFAULT_CONFIG.epochs),
      batchSize: String(DEFAULT_CONFIG.batchSize),
      learningRate: String(DEFAULT_CONFIG.learningRate),
    });
  }

  function handleButtonClick() {
    if (!isValidDataset || isTraining) return;

    // If model was previously trained and user clicks Re-Train Model, expand Advanced settings accordion
    if (hasTrainedModel || status === "completed") {
      setAccordionValue(["advanced"]);
    }

    startTraining(config);
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-full rounded-2xl border bg-white shadow-sm overflow-hidden flex flex-col"
      style={{ borderColor: "#e2e5f0" }}
    >
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center justify-between" style={{ borderColor: "#e2e5f0" }}>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: "#dde2f5" }}>
            <Cpu className="h-4 w-4" style={{ color: "#3d0099" }} />
          </div>
          <div>
            <p className="text-base font-bold text-foreground leading-none">Training</p>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">Configure &amp; run</p>
          </div>
        </div>

        {/* Cancel Training Option when active */}
        {isTraining && (
          <button
            onClick={cancelTraining}
            disabled={isCancelling}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
            id="cancel-training-btn"
            title="Cancel active model training"
          >
            <XCircle className="h-4 w-4" />
            {isCancelling ? "Cancelling..." : "Cancel"}
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-140px)]">
        {/* Validation Status Box */}
        <div
          className={`rounded-xl border p-3.5 text-xs leading-relaxed ${
            isValidDataset
              ? "bg-emerald-50/80 border-emerald-200 text-emerald-800"
              : "bg-amber-50/80 border-amber-200 text-amber-900"
          }`}
        >
          <div className="flex items-start gap-2">
            {isValidDataset ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold text-sm">
                {isValidDataset ? "Dataset Requirement Met" : "Dataset Validation"}
              </p>
              {!hasMinClasses ? (
                <p className="mt-0.5 text-xs font-medium opacity-90">
                  Requires at least 2 enabled classes (currently {enabledClasses.length}).
                </p>
              ) : !allEnabledHaveEnoughImages ? (
                <p className="mt-0.5 text-xs font-medium opacity-90">
                  {invalidClasses.length === 1
                    ? `Class "${invalidClasses[0].name}" needs at least 10 images (currently has ${invalidClasses[0].count}).`
                    : `Each enabled class requires at least 10 images.`}
                </p>
              ) : (
                <p className="mt-0.5 text-xs font-medium opacity-90">
                  Dataset is valid! Ready for MobileNetV2 transfer learning.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Training Progress Display (when training, completed, or error) */}
        {(isTraining || status === "completed" || status === "error") && (
          <div className="space-y-3 rounded-xl border p-3 bg-slate-50/70 text-xs" style={{ borderColor: "#e2e5f0" }}>
            <div className="flex items-center justify-between font-semibold">
              <span className="capitalize flex items-center gap-1.5 text-foreground">
                {isTraining && <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-600" />}
                {status === "training" ? "Training Model..." : status === "completed" ? "Training Complete" : "Training Error"}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">{formattedElapsedTime}</span>
              </div>
            </div>

            {/* Epoch counter */}
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>Epoch</span>
              <span>
                {currentEpoch} / {totalEpochs}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <motion.div
                className="bg-purple-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            <p className="text-[10px] text-right text-muted-foreground font-mono">{progress.toFixed(1)}%</p>

            {/* Error Message if failed/cancelled */}
            {status === "error" && error && (
              <p className="text-[11px] text-red-600 mt-1">{error}</p>
            )}

            {/* Completed Metrics Summary */}
            {status === "completed" && metrics && (
              <div className="pt-2 border-t mt-2 grid grid-cols-2 gap-2 text-[11px]" style={{ borderColor: "#e2e5f0" }}>
                <div>
                  <span className="text-muted-foreground">Train Accuracy:</span>
                  <p className="font-bold text-emerald-700">{(metrics.train_accuracy * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Val Accuracy:</span>
                  <p className="font-bold text-emerald-700">{(metrics.val_accuracy * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Train Loss:</span>
                  <p className="font-medium text-slate-700">{metrics.train_loss.toFixed(3)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Val Loss:</span>
                  <p className="font-medium text-slate-700">{metrics.val_loss.toFixed(3)}</p>
                </div>
                <div className="col-span-2 pt-1">
                  <span className="text-muted-foreground">Duration: </span>
                  <span className="font-semibold text-foreground">{metrics.formatted_duration}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Train Model / Re-Train Model Button */}
        <motion.div whileHover={{ scale: isValidDataset && !isTraining ? 1.01 : 1 }} whileTap={{ scale: isValidDataset && !isTraining ? 0.98 : 1 }}>
          <button
            onClick={handleButtonClick}
            className={`btn-purple w-full flex items-center justify-center gap-2 text-sm transition-all ${
              !isValidDataset || isTraining ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
            }`}
            disabled={!isValidDataset || isTraining}
            id="train-model-btn"
          >
            {isTraining ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Training...
              </>
            ) : hasTrainedModel || status === "completed" ? (
              <>
                <RotateCcw className="h-4 w-4" />
                Re-Train Model
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Train Model
              </>
            )}
          </button>
        </motion.div>

        <Separator />

        <Accordion
          value={accordionValue}
          onValueChange={(val: any) => setAccordionValue(Array.isArray(val) ? val : val ? [val] : [])}
        >
          <AccordionItem value="advanced" className="border-none">
            <AccordionTrigger
              className="py-0 text-sm font-semibold text-foreground hover:no-underline"
              id="advanced-settings-trigger"
            >
              <div className="flex items-center gap-1.5">
                <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
                Advanced
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 pb-1">
              <div className="space-y-3">
                {FIELDS.map(({ id, label, desc, field, step }) => (
                  <div key={id} className="space-y-1">
                    <label htmlFor={id} className="text-xs font-semibold text-foreground">{label}</label>
                    <p className="text-[10px] text-muted-foreground">{desc}</p>
                    <Input
                      id={id}
                      type="number"
                      step={step}
                      value={inputs[field]}
                      onChange={(e) => handleInputChange(field, e.target.value)}
                      onBlur={() => handleInputBlur(field)}
                      disabled={isTraining}
                      className="h-8 text-sm"
                    />
                  </div>
                ))}
                <div className="pt-1 flex flex-col gap-2">
                  <button
                    className="w-full text-xs py-1.5 rounded-lg transition-colors hover:bg-[#eef0f8] cursor-pointer"
                    style={{ color: "#5a5a7a" }}
                    onClick={handleResetDefaults}
                    disabled={isTraining}
                    id="reset-config-btn"
                  >
                    Reset to Defaults
                  </button>

                  <button
                    onClick={() => setShowUnderTheHoodModal(true)}
                    disabled={(!hasTrainedModel && status !== "completed") || isTraining}
                    className={`w-full flex items-center justify-center gap-1.5 text-xs py-2 px-3 rounded-xl border transition-all font-medium ${
                      (hasTrainedModel || status === "completed") && !isTraining
                        ? "bg-purple-50/80 text-purple-700 border-purple-200 hover:bg-purple-100/80 shadow-2xs cursor-pointer"
                        : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60"
                    }`}
                    id="under-the-hood-btn"
                  >
                    <ArrowLeftRight className="h-3.5 w-3.5" />
                    Under the Hood
                  </button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <UnderTheHoodModal
        isOpen={showUnderTheHoodModal}
        onClose={() => setShowUnderTheHoodModal(false)}
      />
    </motion.div>
  );
}
