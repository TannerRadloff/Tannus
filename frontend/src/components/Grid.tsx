import React from 'react';
import { Grid as MuiGrid, GridProps } from '@mui/material';

// Create a wrapper component for MuiGrid that properly handles the 'item' prop
interface ExtendedGridProps extends GridProps {
  item?: boolean;
  container?: boolean;
  xs?: number | boolean;
  sm?: number | boolean;
  md?: number | boolean;
  lg?: number | boolean;
  xl?: number | boolean;
}

const Grid = (props: ExtendedGridProps) => <MuiGrid {...props} />;

export default Grid;
