import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, useTheme, useMediaQuery, Grid, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { ResponsiveContainer, ComposedChart, Line, Bar, Area, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface AgentPerformanceChartProps {
  sessionId: string;
  timeRange?: '1h' | '6h' | '24h' | '7d' | '30d';
  showMemory?: boolean;
  showCpu?: boolean;
  showCompletionRate?: boolean;
  showApiCalls?: boolean;
  height?: number;
}

/**
 * A specialized chart for visualizing agent performance metrics
 * 
 * @param sessionId - ID of the agent session to visualize
 * @param timeRange - Time range to display
 * @param showMemory - Whether to show memory usage
 * @param showCpu - Whether to show CPU usage
 * @param showCompletionRate - Whether to show task completion rate
 * @param showApiCalls - Whether to show API call frequency
 * @param height - Chart height in pixels
 */
const AgentPerformanceChart: React.FC<AgentPerformanceChartProps> = ({
  sessionId,
  timeRange = '1h',
  showMemory = true,
  showCpu = true,
  showCompletionRate = true,
  showApiCalls = true,
  height = 300
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>(timeRange);
  
  // Generate sample performance data
  useEffect(() => {
    // In a real app, this would fetch from an API based on sessionId and timeRange
    const generateData = () => {
      const now = new Date();
      const data = [];
      
      // Determine time interval based on selected range
      let interval: number;
      let points: number;
      
      switch (selectedTimeRange) {
        case '1h':
          interval = 60 * 1000; // 1 minute
          points = 60;
          break;
        case '6h':
          interval = 6 * 60 * 1000; // 6 minutes
          points = 60;
          break;
        case '24h':
          interval = 24 * 60 * 1000; // 24 minutes
          points = 60;
          break;
        case '7d':
          interval = 2 * 60 * 60 * 1000; // 2 hours
          points = 84;
          break;
        case '30d':
          interval = 8 * 60 * 60 * 1000; // 8 hours
          points = 90;
          break;
        default:
          interval = 60 * 1000; // 1 minute
          points = 60;
      }
      
      for (let i = points - 1; i >= 0; i--) {
        const time = new Date(now.getTime() - (i * interval));
        
        // Generate realistic-looking data with some trends and variations
        const baseMemory = 200 + Math.sin(i / 10) * 50;
        const baseCpu = 30 + Math.cos(i / 8) * 20;
        const baseCompletionRate = 50 + Math.sin(i / 15) * 30;
        const baseApiCalls = 10 + Math.sin(i / 5) * 8;
        
        // Add some random variation
        const memory = Math.max(0, Math.min(100, baseMemory + (Math.random() * 20 - 10)));
        const cpu = Math.max(0, Math.min(100, baseCpu + (Math.random() * 15 - 7.5)));
        const completionRate = Math.max(0, Math.min(100, baseCompletionRate + (Math.random() * 10 - 5)));
        const apiCalls = Math.max(0, Math.round(baseApiCalls + (Math.random() * 6 - 3)));
        
        data.push({
          time: time.toLocaleTimeString(),
          fullTime: time,
          memory,
          cpu,
          completionRate,
          apiCalls
        });
      }
      
      return data;
    };
    
    setPerformanceData(generateData());
  }, [sessionId, selectedTimeRange]);
  
  // Handle time range change
  const handleTimeRangeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedTimeRange(event.target.value as string);
  };
  
  // Format X-axis tick based on time range
  const formatXAxisTick = (time: string) => {
    const date = new Date(time);
    
    switch (selectedTimeRange) {
      case '1h':
      case '6h':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case '24h':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case '7d':
        return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`;
      case '30d':
        return `${date.getMonth() + 1}/${date.getDate()}`;
      default:
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 1.5, boxShadow: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
            {label}
          </Typography>
          
          {payload.map((entry: any) => (
            <Box key={entry.name} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  backgroundColor: entry.color,
                  mr: 1,
                  borderRadius: '50%'
                }}
              />
              <Typography variant="body2" sx={{ mr: 1 }}>
                {entry.name}:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {entry.value.toFixed(1)}{entry.name === 'API Calls' ? '' : '%'}
              </Typography>
            </Box>
          ))}
        </Paper>
      );
    }
    return null;
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Agent Performance Metrics
        </Typography>
        
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="time-range-select-label">Time Range</InputLabel>
          <Select
            labelId="time-range-select-label"
            id="time-range-select"
            value={selectedTimeRange}
            label="Time Range"
            onChange={handleTimeRangeChange}
          >
            <MenuItem value="1h">Last Hour</MenuItem>
            <MenuItem value="6h">Last 6 Hours</MenuItem>
            <MenuItem value="24h">Last 24 Hours</MenuItem>
            <MenuItem value="7d">Last 7 Days</MenuItem>
            <MenuItem value="30d">Last 30 Days</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      <Box sx={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={performanceData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="time" 
              scale="band" 
              tick={{ fontSize: isMobile ? 10 : 12 }}
              tickFormatter={formatXAxisTick}
            />
            <YAxis 
              yAxisId="left"
              orientation="left"
              domain={[0, 100]}
              label={{ 
                value: 'Percentage', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle' }
              }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              domain={[0, 'auto']}
              label={{ 
                value: 'Count', 
                angle: 90, 
                position: 'insideRight',
                style: { textAnchor: 'middle' }
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {showMemory && (
              <Area 
                yAxisId="left"
                type="monotone" 
                dataKey="memory" 
                name="Memory Usage" 
                fill={theme.palette.primary.main} 
                stroke={theme.palette.primary.main}
                fillOpacity={0.3}
              />
            )}
            
            {showCpu && (
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="cpu" 
                name="CPU Usage" 
                stroke={theme.palette.secondary.main}
                strokeWidth={2}
              />
            )}
            
            {showCompletionRate && (
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="completionRate" 
                name="Completion Rate" 
                stroke={theme.palette.success.main}
                strokeWidth={2}
              />
            )}
            
            {showApiCalls && (
              <Bar 
                yAxisId="right"
                dataKey="apiCalls" 
                name="API Calls" 
                fill={theme.palette.info.main}
                barSize={20}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default AgentPerformanceChart;
