import assert from "node:assert/strict";
import { EXERCISES } from "../src/data/exercises.js";
import { METHOD_RULES } from "../src/data/methodRules.js";
import { RM_TABLE } from "../src/data/rmTable.js";
import { calculateResults, get1RM, getMethod } from "../src/logic/calculations.js";

assert.equal(EXERCISES.length, 273, "De oefenlijst moet 273 regels uit het Word-document bevatten.");
assert.equal(RM_TABLE.length, 50, "De 1RM-tabel moet herhalingen 1 t/m 50 bevatten.");
assert.equal(METHOD_RULES.length, 12, "Er moeten methodegroepen zijn voor 6 fases x 2 zijdes.");

assert.equal(Math.round(get1RM(22, 59) * 1000) / 1000, 131.111);
assert.equal(Math.round(get1RM(18, 59) * 1000) / 1000, 107.273);
assert.equal(getMethod(5, "sterk", 0.52), "12x65%", "Fase 5 sterk blijft volgens Excel doorlopen.");
assert.equal(getMethod(5, "zwak", 0.52), "15x55%", "Fase 5 zwak blijft volgens Excel doorlopen.");
assert.equal(getMethod(6, "sterk", 0.27), null, "Fase 6 sterk wordt boven 26% '-' in Excel.");
assert.equal(getMethod(3, "zwak", 0.1), "15x60%");

const legExtension = EXERCISES.find((exercise) => exercise.nr === 1);
const result = calculateResults({
  phase: 3,
  slots: [
    {
      id: 1,
      exercise: legExtension,
      note: "st 7",
      type: "normal",
      hasRight: true,
      hhL: "22",
      kgL: "59",
      hhR: "18",
      kgR: "59",
      wattL: "",
      wattR: "",
    },
  ],
});

assert.equal(Math.round(result.averageDifference * 1000) / 1000, 0.182);
assert.equal(result.strongMethod, "12x65%");
assert.equal(result.weakMethod, "15x55%");
assert.equal(Math.round(result.exercises[0].trainingL.kg * 10) / 10, 85.2);
assert.equal(Math.round(result.exercises[0].trainingR.kg * 10) / 10, 59.0);

console.log("Data en rekenlogica zijn gevalideerd.");
