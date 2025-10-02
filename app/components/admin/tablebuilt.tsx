"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

import DialogBuilt from "./dialogbuilt";
import DynamicIcon from "./dynamicon";
import { TableRowModel } from "@/app/components/lib/types";

interface TableProps {
  data: TableRowModel[];
}

export default function TableBuilt({ data }: TableProps) {
  return (
    <div className="p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Id</TableHead>
            <TableHead>Description</TableHead>
            {data[0].actions.map((actions, index) => (
              <TableHead key={index}>Action {index + 1}</TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.id}</TableCell>
              <TableCell>{<DialogBuilt details={row.description} />}</TableCell>
              {row.actions.map((actions, index) => (
                <TableCell key={index}>
                  {
                    <button
                      onClick={actions.function}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-sky-100 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-all"
                    >
                      <DynamicIcon iconName={actions.icon} />
                      <div className="hidden md:inline text-sm font-medium">
                        {actions.text}
                      </div>
                    </button>
                  }
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
