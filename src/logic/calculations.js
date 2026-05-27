import { METHOD_RULES } from "../data/methodRules.js";
import { RM_TABLE } from "../data/rmTable.js";
import { TRAINING_SETS } from "../data/trainingSets.js";

export function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(String(value).replace(",", "."));
  return Number.isFinite(number) ? number : null;
}

export function formatNumber(value, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return "";
  return Number(value).toFixed(digits).replace(".", ",");
}

export function get1RM(repetitions, weight, table = RM_TABLE) {
  const reps = Math.round(toNumber(repetitions) ?? 0);
  const kg = toNumber(weight);
  if (!reps || kg === null) return null;
  const clamped = Math.min(Math.max(reps, 1), 50);
  const row = table.find((item) => item.repetitions === clamped);
  if (!row?.ratio) return null;
  return kg / row.ratio;
}

export function getDifference(left, right) {
  if (left === null || left === undefined || right === null || right === undefined) return null;
  const max = Math.max(left, right);
  return max === 0 ? 0 : Math.abs(left - right) / max;
}

export function parseMethod(method) {
  if (!method || method === "-") return null;
  if (method === "vermogen") return { kind: "power", label: method };
  const match = String(method).match(/(\d+)\s*x\s*(\d+)%/i);
  if (!match) return null;
  return { kind: "repetition", repetitions: Number(match[1]), percentage: Number(match[2]) / 100, label: method };
}

export function getMethod(phase, side, difference = 0) {
  const phaseNumber = Number(phase);
  const rules = METHOD_RULES.find((group) => group.phase === phaseNumber && group.side === side)?.rules;
  if (!rules?.length) return null;
  const value = toNumber(difference) ?? 0;
  let selected = rules[0].method;
  for (const rule of rules) {
    if (value >= rule.threshold) selected = rule.method;
  }
  return selected === "-" ? null : selected;
}

export function getSets(phase, side, overrides = {}) {
  const override = side === "sterk" ? overrides.strongSets : overrides.weakSets;
  if (override) return normalizeSets(override);
  return TRAINING_SETS[side]?.[String(phase)] ?? "";
}

export function normalizeSets(value) {
  if (!value) return "";
  const digits = String(value).replace(/\D/g, "");
  return digits ? `${digits}X` : "";
}

export function methodFromOverride(baseMethod, hh, pct) {
  const reps = toNumber(hh);
  const percentage = toNumber(pct);
  if (!reps && !percentage) return baseMethod;
  const parsed = parseMethod(baseMethod);
  const nextReps = reps || parsed?.repetitions;
  const nextPct = percentage || (parsed?.percentage ? parsed.percentage * 100 : null);
  if (!nextReps || !nextPct) return baseMethod;
  return `${Math.round(nextReps)}x${Math.round(nextPct)}%`;
}

function getSideRole(leftOneRm, rightOneRm, side, hasRight) {
  if (!hasRight || rightOneRm === null || rightOneRm === undefined) return "sterk";
  if (leftOneRm === null || leftOneRm === undefined) return side === "right" ? "sterk" : "zwak";
  if (leftOneRm === rightOneRm) return "sterk";
  return side === "left" ? (leftOneRm > rightOneRm ? "sterk" : "zwak") : rightOneRm > leftOneRm ? "sterk" : "zwak";
}

function buildTraining({ oneRm, originalValue, method, type, sets, watt }) {
  const parsed = parseMethod(method);
  if (!parsed || oneRm === null || oneRm === undefined) return null;
  if (parsed.kind === "power") return { repetitions: "vermogen", kg: null, unit: "vermogen", method };
  const base = type === "keer" || type === "graden" ? toNumber(originalValue) : oneRm;
  const kg = base === null ? null : base * parsed.percentage;
  const result = {
    repetitions: type === "keer" ? sets.replace("X", "x") : parsed.repetitions,
    kg,
    unit: type === "keer" ? "keer" : type === "graden" ? "graden" : "",
    method,
    sets,
  };
  const wattValue = toNumber(watt);
  if (type === "keiser" && wattValue !== null) {
    result.watt = wattValue * parsed.percentage;
    result.unit = "watt";
  }
  return result;
}

export function calculateResults({ slots, phase, overrides = {} }) {
  const exercises = slots.map((slot) => {
    const hhL = toNumber(slot.hhL);
    const kgL = toNumber(slot.kgL);
    const hhR = toNumber(slot.hhR);
    const kgR = toNumber(slot.kgR);
    const oneRmL = get1RM(hhL, kgL);
    const oneRmR = slot.hasRight ? get1RM(hhR, kgR) : null;
    const difference = slot.hasRight ? getDifference(oneRmL, oneRmR) : null;
    return { ...slot, hhLn: hhL, kgLn: kgL, hhRn: hhR, kgRn: kgR, oneRmL, oneRmR, difference };
  });

  const differences = exercises.map((item) => item.difference).filter((value) => value !== null && value > 0);
  const averageDifference = differences.length ? differences.reduce((sum, value) => sum + value, 0) / differences.length : 0;

  const autoStrongMethod = getMethod(phase, "sterk", averageDifference);
  const autoWeakMethod = getMethod(phase, "zwak", averageDifference);
  const strongMethod = methodFromOverride(autoStrongMethod, overrides.strongReps, overrides.strongPct);
  const weakMethod = methodFromOverride(autoWeakMethod, overrides.weakReps, overrides.weakPct);
  const strongSets = getSets(phase, "sterk", overrides);
  const weakSets = getSets(phase, "zwak", overrides);

  const calculated = exercises.map((exercise) => {
    if (!exercise.exercise) return exercise;
    const leftRole = getSideRole(exercise.oneRmL, exercise.oneRmR, "left", exercise.hasRight);
    const rightRole = getSideRole(exercise.oneRmL, exercise.oneRmR, "right", exercise.hasRight);
    const leftMethod = leftRole === "sterk" ? strongMethod : weakMethod;
    const rightMethod = rightRole === "sterk" ? strongMethod : weakMethod;
    const leftSets = leftRole === "sterk" ? strongSets : weakSets;
    const rightSets = rightRole === "sterk" ? strongSets : weakSets;
    return {
      ...exercise,
      leftRole,
      rightRole,
      trainingL: buildTraining({
        oneRm: exercise.oneRmL,
        originalValue: exercise.kgLn,
        method: leftMethod,
        type: exercise.type,
        sets: leftSets,
        watt: exercise.wattL,
      }),
      trainingR: exercise.hasRight
        ? buildTraining({
            oneRm: exercise.oneRmR,
            originalValue: exercise.kgRn,
            method: rightMethod,
            type: exercise.type,
            sets: rightSets,
            watt: exercise.wattR,
          })
        : null,
    };
  });

  return {
    exercises: calculated,
    averageDifference,
    autoStrongMethod,
    autoWeakMethod,
    strongMethod,
    weakMethod,
    strongSets,
    weakSets,
  };
}
