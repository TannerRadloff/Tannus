import React from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, 
  AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell, RadarChart, Radar, 
  PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { Box, Paper, Typography, useTheme, useMediaQuery } from '@mui/material';
import { alpha } from '@mui/material/styles';

interface DataVisualizationProps {
  data: any[];
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'radar';
  xKey: string;
  yKey: string | string[];
  title?: string;
  height?: number;
  colors?: string[];
  stacked?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  aspectRatio?: number;
}

/**
 * A flexible data visualization component that supports multiple chart types
 * and adapts to different screen sizes
 * 
 * @param data - Array of data objects to visualize
 * @param type - Type of chart to render
 * @param xKey - Key for X-axis data
 * @param yKey - Key or keys for Y-axis data
 * @param title - Optional chart title
 * @param height - Chart height in pixels
 * @param colors - Array of colors for chart elements
 * @param stacked - Whether to stack bars/areas (for bar and area charts)
 * @param showGrid - Whether to show grid lines
 * @param showLegend - Whether to show the legend
 * @param showTooltip - Whether to show tooltips
 * @param aspectRatio - Chart aspect ratio (width/height)
 */
const DataVisualization: React.FC<DataVisualizationProps> = ({
  data,
  type,
  xKey,
  yKey,
  title,
  height = 300,
  colors,
  stacked = false,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  aspectRatio = 16/9
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Default colors based on theme
  const defaultColors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.error.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    theme.palette.success.main,
    // Generate additional colors by adjusting hue
    alpha(theme.palette.primary.main, 0.7),
    alpha(theme.palette.secondary.main, 0.7),
    alpha(theme.palette.error.main, 0.7),
    alpha(theme.palette.warning.main, 0.7),
    alpha(theme.palette.info.main, 0.7),
    alpha(theme.palette.success.main, 0.7),
  ];
  
  const chartColors = colors || defaultColors;
  
  // Convert single yKey to array for consistent processing
  const yKeys = Array.isArray(yKey) ? yKey : [yKey];
  
  // Adjust chart dimensions for mobile
  const chartHeight = isMobile ? height * 0.8 : height;
  
  // Render appropriate chart based on type
  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xKey} />
            <YAxis />
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
            {yKeys.map((key, index) => (
              <Line 
                key={key}
                type="monotone" 
                dataKey={key} 
                stroke={chartColors[index % chartColors.length]} 
                activeDot={{ r: 8 }}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        );
        
      case 'bar':
        return (
          <BarChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xKey} />
            <YAxis />
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
            {yKeys.map((key, index) => (
              <Bar 
                key={key}
                dataKey={key} 
                fill={chartColors[index % chartColors.length]} 
                stackId={stacked ? "stack" : undefined}
              />
            ))}
          </BarChart>
        );
        
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey={yKeys[0]}
              nameKey={xKey}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
              ))}
            </Pie>
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
          </PieChart>
        );
        
      case 'area':
        return (
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xKey} />
            <YAxis />
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
            {yKeys.map((key, index) => (
              <Area 
                key={key}
                type="monotone" 
                dataKey={key} 
                fill={chartColors[index % chartColors.length]} 
                stroke={chartColors[index % chartColors.length]}
                fillOpacity={0.6}
                stackId={stacked ? "stack" : undefined}
              />
            ))}
          </AreaChart>
        );
        
      case 'scatter':
        return (
          <ScatterChart
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xKey} type="number" name={xKey} />
            <YAxis dataKey={yKeys[0]} type="number" name={yKeys[0]} />
            {showTooltip && <Tooltip cursor={{ strokeDasharray: '3 3' }} />}
            {showLegend && <Legend />}
            <Scatter 
              name={yKeys[0]} 
              data={data} 
              fill={chartColors[0]} 
            />
            {yKeys.slice(1).map((key, index) => (
              <Scatter 
                key={key}
                name={key} 
                data={data.map(item => ({
                  [xKey]: item[xKey],
                  [key]: item[key]
                }))} 
                fill={chartColors[(index + 1) % chartColors.length]} 
              />
            ))}
          </ScatterChart>
        );
        
      case 'radar':
        return (
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey={xKey} />
            <PolarRadiusAxis />
            {yKeys.map((key, index) => (
              <Radar 
                key={key}
                name={key} 
                dataKey={key} 
                stroke={chartColors[index % chartColors.length]} 
                fill={chartColors[index % chartColors.length]} 
                fillOpacity={0.6} 
              />
            ))}
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
          </RadarChart>
        );
        
      default:
        return (
          <Typography color="error">
            Unsupported chart type: {type}
          </Typography>
        );
    }
  };
  
  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 2, 
        height: 'auto',
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      {title && (
        <Typography 
          variant="h6" 
          gutterBottom 
          align="center"
          sx={{ mb: 2 }}
        >
          {title}
        </Typography>
      )}
      
      <Box sx={{ width: '100%', height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%" aspect={isMobile ? aspectRatio * 0.7 : aspectRatio}>
          {renderChart()}
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default DataVisualization;
