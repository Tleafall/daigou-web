"use client";

import { useMemo, useState } from "react";

type Group = { name: string; values: string[] };

function cartesian(groups: Group[]): Record<string, string>[] {
  const valid = groups
    .map((g) => ({
      name: g.name.trim(),
      values: [...new Set(g.values.map((v) => v.trim()).filter(Boolean))],
    }))
    .filter((g) => g.name && g.values.length > 0);
  if (valid.length === 0) return [];
  return valid.reduce<Record<string, string>[]>(
    (acc, g) => acc.flatMap((combo) => g.values.map((v) => ({ ...combo, [g.name]: v }))),
    [{}],
  );
}

// 以排序後的鍵組成，確保同一組選項不管來源（cartesian 或既有規格）都得到相同 key
export function comboKey(combo: Record<string, string>): string {
  return Object.keys(combo)
    .sort()
    .map((k) => `${k}:${combo[k]}`)
    .join("|");
}

export type VariantCell = { price: string; stock: string };

const inputClass =
  "rounded-lg border border-line px-2 py-1.5 text-sm outline-none focus:border-brand";

export function ProductVariantBuilder({
  initialGroups = [],
  initialCells = {},
  initialSingle = { price: "", stock: "0" },
}: {
  initialGroups?: Group[];
  initialCells?: Record<string, VariantCell>;
  initialSingle?: VariantCell;
} = {}) {
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [cells, setCells] = useState<Record<string, VariantCell>>(initialCells);
  const [single, setSingle] = useState<VariantCell>(initialSingle);

  const validGroups = useMemo(
    () =>
      groups
        .map((g) => ({
          name: g.name.trim(),
          values: [...new Set(g.values.map((v) => v.trim()).filter(Boolean))],
        }))
        .filter((g) => g.name && g.values.length > 0),
    [groups],
  );
  const combos = useMemo(() => cartesian(groups), [groups]);
  const hasOptions = validGroups.length > 0;

  // 送出用的隱藏欄位內容
  const payload = hasOptions
    ? {
        optionGroups: validGroups,
        variants: combos.map((combo) => {
          const cell = cells[comboKey(combo)] ?? { price: "", stock: "0" };
          return {
            options: combo,
            price: Number(cell.price) || 0,
            stock: Number(cell.stock) || 0,
          };
        }),
      }
    : {
        optionGroups: [],
        variants: [
          { options: {}, price: Number(single.price) || 0, stock: Number(single.stock) || 0 },
        ],
      };

  // ---- 群組操作 ----
  function addGroup() {
    setGroups((g) => [...g, { name: "", values: [""] }]);
  }
  function removeGroup(i: number) {
    setGroups((g) => g.filter((_, idx) => idx !== i));
  }
  function setGroupName(i: number, name: string) {
    setGroups((g) => g.map((grp, idx) => (idx === i ? { ...grp, name } : grp)));
  }
  function addValue(i: number) {
    setGroups((g) => g.map((grp, idx) => (idx === i ? { ...grp, values: [...grp.values, ""] } : grp)));
  }
  function setValue(i: number, vi: number, val: string) {
    setGroups((g) =>
      g.map((grp, idx) =>
        idx === i ? { ...grp, values: grp.values.map((v, j) => (j === vi ? val : v)) } : grp,
      ),
    );
  }
  function removeValue(i: number, vi: number) {
    setGroups((g) =>
      g.map((grp, idx) =>
        idx === i ? { ...grp, values: grp.values.filter((_, j) => j !== vi) } : grp,
      ),
    );
  }
  function setCell(key: string, field: "price" | "stock", val: string) {
    setCells((c) => ({ ...c, [key]: { ...(c[key] ?? { price: "", stock: "0" }), [field]: val } }));
  }

  return (
    <div className="flex flex-col gap-4">
      <input type="hidden" name="variantsJson" value={JSON.stringify(payload)} readOnly />

      {/* 規格類型 */}
      <div className="flex flex-col gap-3">
        {groups.map((g, i) => (
          <div key={i} className="rounded-lg border border-line p-3">
            <div className="flex items-center gap-2">
              <input
                value={g.name}
                onChange={(e) => setGroupName(i, e.target.value)}
                placeholder="規格名稱（如：容量、顏色）"
                className={`${inputClass} flex-1`}
              />
              <button
                type="button"
                onClick={() => removeGroup(i)}
                className="text-xs text-ink/50 hover:text-red-500"
              >
                移除
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {g.values.map((v, vi) => (
                <span key={vi} className="flex items-center gap-1">
                  <input
                    value={v}
                    onChange={(e) => setValue(i, vi, e.target.value)}
                    placeholder="選項（如：120ml）"
                    className={`${inputClass} w-32`}
                  />
                  {g.values.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeValue(i, vi)}
                      className="text-ink/40 hover:text-red-500"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
              <button
                type="button"
                onClick={() => addValue(i)}
                className="rounded-lg border border-dashed border-line px-3 py-1.5 text-xs text-ink/60 hover:border-brand hover:text-brand"
              >
                ＋ 選項
              </button>
            </div>
          </div>
        ))}

        {groups.length < 3 && (
          <button
            type="button"
            onClick={addGroup}
            className="self-start rounded-lg border border-dashed border-line px-3 py-2 text-sm text-ink/60 hover:border-brand hover:text-brand"
          >
            ＋ 新增規格類型（如 容量、顏色）
          </button>
        )}
      </div>

      {/* 價格與庫存 */}
      {hasOptions ? (
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[420px] text-sm">
            <thead className="bg-muted text-left text-xs text-ink/60">
              <tr>
                <th className="px-3 py-2">規格</th>
                <th className="px-3 py-2">售價 (NT$)</th>
                <th className="px-3 py-2">庫存</th>
              </tr>
            </thead>
            <tbody>
              {combos.map((combo) => {
                const key = comboKey(combo);
                const cell = cells[key] ?? { price: "", stock: "0" };
                const label = Object.entries(combo)
                  .map(([k, v]) => `${k}：${v}`)
                  .join("、");
                return (
                  <tr key={key} className="border-t border-line">
                    <td className="px-3 py-2 text-ink/80">{label}</td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        value={cell.price}
                        onChange={(e) => setCell(key, "price", e.target.value)}
                        className={`${inputClass} w-24`}
                        placeholder="0"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        value={cell.stock}
                        onChange={(e) => setCell(key, "stock", e.target.value)}
                        className={`${inputClass} w-20`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-wrap items-end gap-4 rounded-lg border border-line p-3">
          <label className="text-sm">
            <span className="mb-1 block text-ink/60">售價（NT$）*</span>
            <input
              type="number"
              min="1"
              value={single.price}
              onChange={(e) => setSingle((s) => ({ ...s, price: e.target.value }))}
              className={`${inputClass} w-32`}
              placeholder="590"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-ink/60">庫存</span>
            <input
              type="number"
              min="0"
              value={single.stock}
              onChange={(e) => setSingle((s) => ({ ...s, stock: e.target.value }))}
              className={`${inputClass} w-24`}
            />
          </label>
          <p className="text-xs text-ink/40">未新增規格類型＝單一規格商品</p>
        </div>
      )}
    </div>
  );
}
