"use client";

import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  closestCenter 
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { ArrowRight } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface FieldMappingProps {
  availableColumns: string[];
  sampleData: any[];
  onMapping: (mapping: Record<string, string>) => void;
}

const targetFields = [
  { id: 'sku', label: 'SKU/Reference', description: 'Unique product identifier' },
  { id: 'name', label: 'Product Name', description: 'Name of the product' },
  { id: 'price_ht', label: 'Price HT', description: 'Price excluding tax' },
  { id: 'stock', label: 'Stock', description: 'Available quantity' },
];

function DraggableColumn({
  column,
  sampleValue,
  isUsed,
}: {
  column: string;
  sampleValue?: string;
  isUsed: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `source:${column}`,
    data: {
      type: 'source',
      column,
    },
  });

  // Ne pas afficher le composant en position originale s’il est en train d’être draggé
  if (isDragging) return null;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`p-3 bg-background border rounded-lg cursor-move hover:border-primary transition-colors ${
        isUsed ? 'opacity-50' : ''
      }`}
    >
      <div className="font-medium">{column}</div>
      {sampleValue && (
        <div className="text-sm text-muted-foreground mt-1">
          Example: {sampleValue}
        </div>
      )}
    </div>
  );
}


function DroppableField({
  field,
  mappedColumn,
  sampleValue,
}: {
  field: { id: string; label: string; description: string };
  mappedColumn?: string;
  sampleValue?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `target:${field.id}`,
    data: {
      type: 'target',
      field: field.id,
    },
  });

  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: `source:${mappedColumn}`, // ✅ même format que les autres
    data: {
      type: 'source',
      column: mappedColumn,
    },
    disabled: !mappedColumn, // éviter erreur si pas mappé
  });

  return (
    <div
      ref={setNodeRef}
      className={`p-3 border rounded-lg transition-colors ${
        isOver ? 'border-primary border-2' :
        mappedColumn ? 'bg-primary/5 border-primary' : 'bg-muted border-dashed'
      }`}
    >
      <div className="font-medium">{field.label}</div>
      <div className="text-sm text-muted-foreground mt-1">{field.description}</div>

      {mappedColumn && sampleValue && (
        <div
          ref={setDragRef}
          {...listeners}
          {...attributes}
          className={`mt-2 p-2 bg-background rounded text-sm cursor-move ${
            isDragging ? 'opacity-50' : ''
          }`}
        >
          <div className="text-muted-foreground">Mapped to: {mappedColumn}</div>
          <div className="font-medium">Preview: {sampleValue}</div>
        </div>
      )}

      {!mappedColumn && (
        <div className="mt-2 text-sm text-muted-foreground italic">
          Drop a column here
        </div>
      )}
    </div>
  );
}


export function FieldMapping({ availableColumns, sampleData, onMapping }: FieldMappingProps) {
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const { setNodeRef: setUnmappedRef, isOver: isOverUnmapped } = useDroppable({
  id: 'unmapped',
}); 
  
  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event;

  setActiveId(null);

  if (!over) return;

  const sourceId = active.id as string;
  const targetId = over.id as string;

  const sourceColumn = sourceId.replace('source:', '');

  // Si on drop dans la zone "unmapped", on retire ce mapping
  if (targetId === 'unmapped') {
    const updatedMappings = { ...mappings };

    for (const [key, value] of Object.entries(updatedMappings)) {
      if (value === sourceColumn) {
        delete updatedMappings[key];
      }
    }

    setMappings(updatedMappings);
    onMapping(updatedMappings);
    return;
  }

  // Drop dans une autre zone (droppable field)
  if (targetId.startsWith('target:')) {
    const targetField = targetId.replace('target:', '');
    const updatedMappings = { ...mappings };

    // Supprimer le mapping précédent de ce column si existe
    for (const [key, value] of Object.entries(updatedMappings)) {
      if (value === sourceColumn) {
        delete updatedMappings[key];
      }
    }

    updatedMappings[targetField] = sourceColumn;

    setMappings(updatedMappings);
    onMapping(updatedMappings);
  }
}


  return (
    <div className="space-y-8">
      {/* Sample Data Preview */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Sample Data Preview</h3>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {availableColumns.map((column) => (
                  <TableHead key={column}>{column}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sampleData.slice(0, 2).map((row, index) => (
                <TableRow key={index}>
                  {availableColumns.map((column) => (
                    <TableCell key={column}>{row[column]}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

<DndContext
  sensors={sensors}
  collisionDetection={closestCenter}
  onDragStart={handleDragStart}
  onDragEnd={handleDragEnd}
>
  <div className="grid grid-cols-3 gap-6">
    {/* Source Columns */}
    <div
      ref={setUnmappedRef}
      className={`space-y-2 p-2 border rounded min-h-[200px] transition-all ${
        isOverUnmapped ? 'border-primary border-2' : 'border-dashed'
      }`}
    >
      <h3 className="font-medium text-sm">CSV Columns</h3>

      {availableColumns
        .filter((column) => !Object.values(mappings).includes(column))
        .map((column) => (
          <DraggableColumn
            key={column}
            column={column}
            sampleValue={sampleData[0]?.[column]}
            isUsed={false}
          />
        ))}

      {/* Message si tout est mappé */}
      {Object.values(mappings).length === availableColumns.length && (
        <div className="text-muted-foreground text-sm italic">
          Drop here to remove a mapping
        </div>
      )}
    </div>

    {/* Arrow Column */}
    <div className="flex items-center justify-center">
      <ArrowRight className="w-6 h-6 text-muted-foreground" />
    </div>

    {/* Target Fields */}
    <div className="space-y-4">
      <h3 className="font-medium text-sm">System Fields</h3>
      <div className="space-y-2">
        {targetFields.map((field) => (
          <DroppableField
            key={field.id}
            field={field}
            mappedColumn={mappings[field.id]}
            sampleValue={sampleData[0]?.[mappings[field.id]]}
          />
        ))}
      </div>
    </div>
  </div>

  {/* Drag Overlay */}
  <DragOverlay adjustScale={false}>
    {activeId ? (
      <div
        className="p-3 bg-background border rounded-lg shadow-lg pointer-events-none"
        style={{ transform: 'translate(0, 0)' }}
      >
        <div className="font-medium">{activeId.replace('source:', '')}</div>
        {sampleData[0] && (
          <div className="text-sm text-muted-foreground mt-1">
            Example: {sampleData[0][activeId.replace('source:', '')]}
          </div>
        )}
      </div>
    ) : null}
  </DragOverlay>
</DndContext>


      {/* Final Mapping Preview */}
      {Object.keys(mappings).length > 0 && (
        <div className="mt-8 space-y-2">
          <h3 className="text-sm font-medium">Final Mapping Preview</h3>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>System Field</TableHead>
                  <TableHead>CSV Column</TableHead>
                  <TableHead>Sample Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {targetFields.map((field) => (
                  <TableRow key={field.id}>
                    <TableCell className="font-medium">{field.label}</TableCell>
                    <TableCell>{mappings[field.id] || '—'}</TableCell>
                    <TableCell>
                      {mappings[field.id] && sampleData[0] 
                        ? sampleData[0][mappings[field.id]] 
                        : '—'
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}