"use client";

import { useState } from "react";
import { Cpu, Play, Settings2, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { Input } from "@/components/ui/input";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { TrainingConfig, ImageClass } from "@/types";

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

  // Validation logic
  const enabledClasses = classes.filter((c) => !c.disabled);

  const hasMinClasses = enabledClasses.length >= 2;
  const allEnabledHaveImages = enabledClasses.length > 0 && enabledClasses.every((c) => (c.images?.length || c.imageCount || 0) > 0);
  const isValidDataset = hasMinClasses && allEnabledHaveImages;

  function handleConfigChange(field: keyof TrainingConfig, value: string) {
    const num = parseFloat(value);
    if (!isNaN(num)) setConfig((prev) => ({ ...prev, [field]: num }));
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-full rounded-2xl border bg-white shadow-sm overflow-hidden"
      style={{ borderColor: "#e2e5f0" }}
    >
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center gap-2" style={{ borderColor: "#e2e5f0" }}>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: "#dde2f5" }}>
          <Cpu className="h-3.5 w-3.5" style={{ color: "#3d0099" }} />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground leading-none">Training</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Configure &amp; run</p>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        {/* Validation Status Box */}
        <div
          className={`rounded-xl border p-3 text-xs leading-relaxed ${
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
              <p className="font-semibold">
                {isValidDataset ? "Dataset Requirement Met" : "Dataset Validation"}
              </p>
              {!hasMinClasses ? (
                <p className="mt-0.5 text-[11px] opacity-90">
                  Requires at least 2 enabled classes (currently {enabledClasses.length}).
                </p>
              ) : !allEnabledHaveImages ? (
                <p className="mt-0.5 text-[11px] opacity-90">
                  Each enabled class must have at least 1 image sample.
                </p>
              ) : (
                <p className="mt-0.5 text-[11px] opacity-90">
                  Dataset is valid! Training model execution arrives in Phase 3.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Train Model Button (Disabled / Coming Soon) */}
        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
          <button
            className="btn-purple w-full flex items-center justify-center gap-2 text-sm opacity-60 cursor-not-allowed"
            disabled
            id="train-model-btn"
          >
            <Play className="h-4 w-4" />
            Train Model (Coming Soon)
          </button>
        </motion.div>

        <Separator />

        <Accordion multiple={false}>
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
            <AccordionContent className="pt-4 pb-0">
              <div className="space-y-3">
                {FIELDS.map(({ id, label, desc, field, step }) => (
                  <div key={id} className="space-y-1">
                    <label htmlFor={id} className="text-xs font-semibold text-foreground">{label}</label>
                    <p className="text-[10px] text-muted-foreground">{desc}</p>
                    <Input
                      id={id}
                      type="number"
                      step={step}
                      value={config[field]}
                      onChange={(e) => handleConfigChange(field, e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                ))}
                <button
                  className="w-full text-xs py-1.5 rounded-lg transition-colors hover:bg-[#eef0f8]"
                  style={{ color: "#5a5a7a" }}
                  onClick={() => setConfig(DEFAULT_CONFIG)}
                  id="reset-config-btn"
                >
                  Reset to Defaults
                </button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </motion.div>
  );
}
