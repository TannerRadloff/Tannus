import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, useTheme, useMediaQuery, Grid, FormControl, InputLabel, Select, MenuItem, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { ResponsiveContainer, Treemap, Tooltip, Sankey, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend } from 'recharts';

interface PlanVisualizationProps {
  planId: string;
  visualizationType?: 'treemap' | 'sankey' | 'radar';
  height?: number;
}

/**
 * A specialized visualization component for plan structure and dependencies
 * 
 * @param planId - ID of the plan to visualize
 * @param visualizationType - Type of visualization to display
 * @param height - Chart height in pixels
 */
const PlanVisualization: React.FC<PlanVisualizationProps> = ({
  planId,
  visualizationType: initialType = 'treemap',
  height = 400
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [visualizationType, setVisualizationType] = useState<'treemap' | 'sankey' | 'radar'>(initialType);
  const [planData, setPlanData] = useState<any>(null);
  
  // Generate sample plan data
  useEffect(() => {
    // In a real app, this would fetch from an API based on planId
    const generateData = () => {
      // Sample plan structure
      const steps = [
        { id: 'step1', name: 'Research', status: 'completed', value: 20, completion: 100 },
        { id: 'step2', name: 'Planning', status: 'completed', value: 15, completion: 100 },
        { id: 'step3', name: 'Implementation', status: 'in_progress', value: 40, completion: 65 },
        { id: 'step4', name: 'Testing', status: 'not_started', value: 15, completion: 0 },
        { id: 'step5', name: 'Deployment', status: 'not_started', value: 10, completion: 0 }
      ];
      
      // Sample dependencies for Sankey diagram
      const dependencies = [
        { source: 'step1', target: 'step2', value: 15 },
        { source: 'step2', target: 'step3', value: 15 },
        { source: 'step3', target: 'step4', value: 15 },
        { source: 'step4', target: 'step5', value: 10 },
        { source: 'step1', target: 'step3', value: 5 }
      ];
      
      // Sample radar data
      const radarData = [
        { subject: 'Research', A: 100, fullMark: 100 },
        { subject: 'Planning', A: 100, fullMark: 100 },
        { subject: 'Implementation', A: 65, fullMark: 100 },
        { subject: 'Testing', A: 0, fullMark: 100 },
        { subject: 'Deployment', A: 0, fullMark: 100 }
      ];
      
      return {
        treemap: {
          name: 'Plan',
          children: steps.map(step => ({
            name: step.name,
            size: step.value,
            completion: step.completion,
            status: step.status
          }))
        },
        sankey: {
          nodes: steps.map(step => ({ name: step.id })),
          links: dependencies
        },
        radar: radarData
      };
    };
    
    setPlanData(generateData());
  }, [planId]);
  
  // Handle visualization type change
  const handleVisualizationTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    newType: 'treemap' | 'sankey' | 'radar' | null
  ) => {
    if (newType !== null) {
      setVisualizationType(newType);
    }
  };
  
  // Custom tooltip for TreeMap
  const TreeMapTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Paper sx={{ p: 1.5, boxShadow: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
            {data.name}
          </Typography>
          <Typography variant="body2">
            Effort: {data.size}%
          </Typography>
          <Typography variant="body2">
            Completion: {data.completion}%
          </Typography>
          <Typography variant="body2">
            Status: {data.status.replace('_', ' ')}
          </Typography>
        </Paper>
      );
    }
    return null;
  };
  
  // Custom tooltip for Radar
  const RadarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Paper sx={{ p: 1.5, boxShadow: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
            {data.subject}
          </Typography>
          <Typography variant="body2">
            Completion: {data.A}%
          </Typography>
        </Paper>
      );
    }
    return null;
  };
  
  // Get color based on completion status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return theme.palette.success.main;
      case 'in_progress':
        return theme.palette.warning.main;
      case 'not_started':
        return theme.palette.action.disabled;
      default:
        return theme.palette.primary.main;
    }
  };
  
  // Custom content for Treemap
  const CustomizedContent = (props: any) => {
    const { x, y, width, height, name, payload } = props;
    const data = payload as any;
    
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: getStatusColor(data.status),
            stroke: theme.palette.background.paper,
            strokeWidth: 2,
            strokeOpacity: 1,
          }}
        />
        {width > 50 && height > 30 && (
          <text
            x={x + width / 2}
            y={y + height / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{
              fill: theme.palette.getContrastText(getStatusColor(data.status)),
              fontSize: 14,
              fontWeight: 'bold',
            }}
          >
            {name}
          </text>
        )}
        {width > 50 && height > 50 && (
          <text
            x={x + width / 2}
            y={y + height / 2 + 15}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{
              fill: theme.palette.getContrastText(getStatusColor(data.status)),
              fontSize: 12,
            }}
          >
            {data.completion}%
          </text>
        )}
      </g>
    );
  };
  
  // Render appropriate visualization based on type
  const renderVisualization = () => {
    if (!planData) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Typography>Loading plan data...</Typography>
        </Box>
      );
    }
    
    switch (visualizationType) {
      case 'treemap':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={planData.treemap}
              dataKey="size"
              aspectRatio={4 / 3}
              stroke={theme.palette.background.paper}
              fill={theme.palette.primary.main}
              content={<CustomizedContent />}
            >
              <Tooltip content={<TreeMapTooltip />} />
            </Treemap>
          </ResponsiveContainer>
        );
        
      case 'sankey':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <Sankey
              data={planData.sankey}
              nodePadding={50}
              margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
              link={{ stroke: theme.palette.mode === 'dark' ? '#444' : '#ddd' }}
              node={{
                fill: theme.palette.primary.main,
                stroke: theme.palette.primary.dark,
              }}
            >
              <Tooltip />
            </Sankey>
          </ResponsiveContainer>
        );
        
      case 'radar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={planData.radar}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis domain={[0, 100]} />
              <Radar
                name="Completion"
                dataKey="A"
                stroke={theme.palette.primary.main}
                fill={theme.palette.primary.main}
                fillOpacity={0.6}
              />
              <Tooltip content={<RadarTooltip />} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        );
        
      default:
        return (
          <Typography color="error">
            Unsupported visualization type: {visualizationType}
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
        <Typography variant="h6">
          Plan Visualization
        </Typography>
        
        <ToggleButtonGroup
          value={visualizationType}
          exclusive
          onChange={handleVisualizationTypeChange}
          aria-label="visualization type"
          size={isMobile ? "small" : "medium"}
        >
          <ToggleButton value="treemap" aria-label="treemap">
            TreeMap
          </ToggleButton>
          <ToggleButton value="sankey" aria-label="sankey">
            Dependencies
          </ToggleButton>
          <ToggleButton value="radar" aria-label="radar">
            Radar
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      
      <Box sx={{ width: '100%', height }}>
        {renderVisualization()}
      </Box>
    </Paper>
  );
};

export default PlanVisualization;
