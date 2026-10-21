export type ColumnFilter =
  | { column: number; mode: 'empty' | 'nonempty' }
  | { column: number; mode: 'contains'; text: string }
  | { column: number; mode: 'selected' | 'excluded'; values: string[] };

export type CsvQuery = {
  all: string;
  filters: ColumnFilter[];
  sortColumn: number;
  sortDirection: 'asc' | 'desc';
};
