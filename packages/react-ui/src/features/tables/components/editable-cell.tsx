import { Edit2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { CalculatedColumn } from 'react-data-grid';

import { Button } from '@/components/ui/button';
import { cn, formatUtils } from '@/lib/utils';
import { FieldType } from '@activepieces/shared';

import { Row } from '../lib/types';

import { DateEditor } from './date-editor';
import { TextEditor } from './text-editor';

type EditableCellProps = {
  type: FieldType;
  value: string;
  row: Row;
  column: CalculatedColumn<Row, { id: string }>;
  onRowChange: (row: Row, commitChanges: boolean) => void;
  rowIdx: number;
};

export function EditableCell({
  type,
  value: initialValue,
  row,
  column,
  onRowChange,
  rowIdx,
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isSelected &&
        !(event.target as HTMLElement).closest(
          `#editable-cell-${rowIdx}-${column.idx}`,
        )
      ) {
        setIsSelected(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isSelected]);

  if (isEditing) {
    let Editor;
    switch (type) {
      case FieldType.DATE:
        Editor = DateEditor;
        break;
      default:
        Editor = TextEditor; // TextEditor is used for numbers too
    }

    return (
      <Editor
        row={row}
        rowIdx={rowIdx}
        column={column}
        type={type}
        value={value}
        onRowChange={(newRow, commitChanges) => {
          if (commitChanges) {
            setValue(newRow[column.key]);
            onRowChange(newRow, commitChanges);
            setIsEditing(false);
          }
        }}
        onClose={() => {
          setIsEditing(false);
          setIsHovered(false);
        }}
      />
    );
  }

  return (
    <div
      id={`editable-cell-${rowIdx}-${column.idx}`}
      className={cn(
        'h-full flex items-center justify-between gap-2 pl-2 py-2',
        'group cursor-pointer border',
        isSelected ? 'border-primary' : 'border-transparent',
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setIsSelected(true)}
      onDoubleClick={() => setIsEditing(true)}
    >
      <span className="flex-1 truncate">
        {type === FieldType.DATE && value
          ? formatUtils.formatDateOnly(new Date(value))
          : value}
      </span>
      {isHovered && (
        <Button
          variant="transparent"
          size="sm"
          className="text-gray-500"
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
        >
          <div className="hover:bg-primary/10 p-1">
            <Edit2 className="h-4 w-4 text-muted-foreground" />
          </div>
        </Button>
      )}
    </div>
  );
}
