import { taskColors, type TaskColor } from '../../../domain/board';
import { taskColorLabels, taskColorValues } from './taskColorMeta';

type TaskColorPickerProps = {
  value: TaskColor;
  onChange(color: TaskColor): void;
};

export function TaskColorPicker({ value, onChange }: TaskColorPickerProps) {
  return (
    <fieldset className="color-picker">
      <legend>Color</legend>
      <div className="color-picker__swatches">
        {taskColors.map((color) => (
          <button
            className={`color-swatch ${value === color ? 'color-swatch--selected' : ''}`}
            key={color}
            type="button"
            onClick={() => onChange(color)}
            title={taskColorLabels[color]}
            aria-label={taskColorLabels[color]}
            aria-pressed={value === color}
          >
            <span style={{ background: taskColorValues[color] }} />
          </button>
        ))}
      </div>
    </fieldset>
  );
}
