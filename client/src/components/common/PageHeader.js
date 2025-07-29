import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link,
  Button,
  useTheme,
  Divider,
  Stack
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Home as HomeIcon } from '@mui/icons-material';

/**
 * A reusable page header component with title, subtitle, breadcrumbs and optional action button
 */
const PageHeader = ({
  title,
  subtitle,
  breadcrumbs = [],
  actionLabel,
  actionIcon,
  onActionClick,
  actionVariant = 'contained',
  actionColor = 'primary',
  extraActions = []
}) => {
  const theme = useTheme();

  return (
    <Box sx={{ mb: 4 }}>
      {/* Breadcrumbs navigation */}
      {breadcrumbs.length > 0 && (
        <Breadcrumbs
          aria-label="breadcrumb"
          sx={{ mb: 2, '& .MuiBreadcrumbs-ol': { flexWrap: 'wrap' } }}
        >
          <Link
            underline="hover"
            color="inherit"
            component={RouterLink}
            to="/"
            sx={{ 
              display: 'flex', 
              alignItems: 'center' 
            }}
          >
            <HomeIcon sx={{ mr: 0.5, fontSize: 18 }} />
            Home
          </Link>
          
          {breadcrumbs.map((crumb, index) => (
            index === breadcrumbs.length - 1 ? (
              <Typography 
                key={`breadcrumb-${index}`} 
                color="text.primary"
                sx={{ fontWeight: 500 }}
              >
                {crumb.label}
              </Typography>
            ) : (
              <Link
                key={`breadcrumb-${index}`}
                underline="hover"
                color="inherit"
                component={RouterLink}
                to={crumb.path}
              >
                {crumb.label}
              </Link>
            )
          ))}
        </Breadcrumbs>
      )}
      
      {/* Header content */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
          gap: 2
        }}
      >
        {/* Title and subtitle */}
        <Box>
          <Typography 
            variant="h4" 
            component="h1" 
            fontWeight={600} 
            gutterBottom
          >
            {title}
          </Typography>
          
          {subtitle && (
            <Typography variant="body1" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        
        {/* Action buttons */}
        <Stack direction="row" spacing={2}>
          {extraActions.map((action, index) => (
            <Button
              key={`extra-action-${index}`}
              variant="outlined"
              color={action.color || 'primary'}
              onClick={action.onClick}
              startIcon={action.icon}
              sx={{ 
                whiteSpace: 'nowrap'
              }}
            >
              {action.label}
            </Button>
          ))}
          
          {/* Main action button if provided */}
          {actionLabel && onActionClick && (
            <Button
              variant={actionVariant}
              color={actionColor}
              onClick={onActionClick}
              startIcon={actionIcon}
              sx={{ 
                px: 3, 
                py: 1,
                whiteSpace: 'nowrap'
              }}
            >
              {actionLabel}
            </Button>
          )}
        </Stack>
      </Box>
      
      <Divider sx={{ mt: 3, mb: 3 }} />
    </Box>
  );
};

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  breadcrumbs: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      path: PropTypes.string
    })
  ),
  actionLabel: PropTypes.string,
  actionIcon: PropTypes.node,
  onActionClick: PropTypes.func,
  actionVariant: PropTypes.string,
  actionColor: PropTypes.string,
  extraActions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      icon: PropTypes.node,
      onClick: PropTypes.func.isRequired,
      color: PropTypes.string
    })
  )
};

export default PageHeader; 