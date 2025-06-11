import React, { useCallback, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridReadyEvent, GridApi } from 'ag-grid-community';

// Import AG Grid CSS
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

// Enable AG Grid Enterprise features
import 'ag-grid-enterprise';

interface DataGridProps<T = any> {
  rowData: T[];
  columnDefs: ColDef[];
  className?: string;
  defaultColDef?: ColDef;
  onGridReady?: (event: GridReadyEvent) => void;
}

export const DataGrid = <T extends object>({
  rowData,
  columnDefs,
  className = 'ag-theme-alpine',
  defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true,
  },
  onGridReady,
}: DataGridProps<T>) => {
  const gridRef = useRef<AgGridReact>(null);
  const gridApiRef = useRef<GridApi | null>(null);

  const handleGridReady = useCallback((params: GridReadyEvent) => {
    gridApiRef.current = params.api;
    if (onGridReady) {
      onGridReady(params);
    }
  }, [onGridReady]);

  return (
    <div className={`w-full h-[500px] ${className}`}>
      <AgGridReact
        ref={gridRef}
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        onGridReady={handleGridReady}
        enableRangeSelection={true}
        enableCharts={true}
        rowGroupPanelShow="always"
        statusBar={{
          statusPanels: [
            { statusPanel: 'agTotalRowCountComponent', align: 'left' },
            { statusPanel: 'agFilteredRowCountComponent' },
          ],
        }}
      />
    </div>
  );
};

export default DataGrid; 