import { useCalendar } from "@/calendar/contexts/calendar-context";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
    SelectSeparator
} from "@/components/ui/select";
import { ENTITY_TYPE_LABELS, type IEntity } from "@/calendar/entities";
import React from "react";


export function EntitySelect() {
    const { entities, selectedEntity, setSelectedEntity } = useCalendar();

    const groupedEntities = React.useMemo(() => {
        const groups: Record<string, IEntity[]> = {};
        entities.forEach(entity => {
            if (!groups[entity.type]) {
                groups[entity.type] = [];
            }
            groups[entity.type].push(entity);
        });
        return groups;
    }, [entities]);

    const typeOrder: Array<IEntity["type"]> = ["department", "club", "cell", "administration", "other"];
    return (
        <Select value={selectedEntity || "all"}
            onValueChange={(val) => setSelectedEntity(val === "all" ? "all" : val)}>
            <SelectTrigger className="flex-1 md:w-48">
                <SelectValue placeholder="Select an entity" />
            </SelectTrigger>
            <SelectContent align="end" className="max-h-[300px]">

                <SelectItem value="all" className="font-semibold text-foreground">
                    All Entities
                </SelectItem>
                <SelectSeparator className="my-1" />

                {typeOrder.map(type => {
                    const groupEntities = groupedEntities[type];
                    if (!groupEntities?.length) return null;
                    return (
                        <SelectGroup key={type}>
                            <SelectLabel className="text-muted-foreground text-xs uppercase tracking-wider pl-2 mt-2">
                                {ENTITY_TYPE_LABELS[type]}
                            </SelectLabel>
                            {groupEntities.map(entity => (
                                <SelectItem key={entity.id} value={entity.id}>
                                    {entity.name}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    );
                })}
            </SelectContent>
        </Select>

    )
}

