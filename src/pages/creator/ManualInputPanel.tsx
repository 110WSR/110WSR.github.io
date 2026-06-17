import { ATTRIBUTE_FIELDS } from "./types";
import AttributeInput from "./AttributeInput";
import type { Attributes } from "../../shared/storage/types";

export default function ManualInputPanel({ attributes, onAttributeChange }: { attributes: Attributes; onAttributeChange: (key: keyof Attributes, val: number) => void }) {
  return (
    <div>
      <div className="text-stone-400 text-sm mb-4">自由填写属性值（范围 3-18）：</div>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {ATTRIBUTE_FIELDS.map((field) => <AttributeInput key={field.key} label={field.label} abbr={field.abbr} value={attributes[field.key]} onChange={(val) => onAttributeChange(field.key, val)} min={3} max={18} />)}
      </div>
    </div>
  );
}