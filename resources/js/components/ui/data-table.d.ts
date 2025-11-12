import * as React from 'react';
import { ColumnDef, Row } from '@tanstack/react-table';

declare module '@/components/ui/data-table' {
  interface DataTableProps<TData> {
    columns: ColumnDef<TData>[];
    data: TData[];
    searchKey: string;
    onSearch?: (value: string) => void;
    loading?: boolean;
    className?: string;
  }

  const DataTable: <TData>(
    props: DataTableProps<TData> & React.HTMLAttributes<HTMLDivElement>
  ) => JSX.Element;

  export { DataTable };
}

declare const DataTable: <TData>(
  props: {
    columns: ColumnDef<TData>[];
    data: TData[];
    searchKey: string;
    onSearch?: (value: string) => void;
    loading?: boolean;
    className?: string;
  } & React.HTMLAttributes<HTMLDivElement>
) => JSX.Element;

export { DataTable };
