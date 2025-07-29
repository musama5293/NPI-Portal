import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Paper,
  Button,
  Typography,
  CircularProgress,
  Divider,
  Alert,
  useTheme
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';

/**
 * A reusable form layout component that provides consistent structure and styling for forms
 */
const FormLayout = ({
  title,
  subtitle,
  children,
  onSubmit,
  onCancel,
  isLoading = false,
  error = null,
  success = null,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  maxWidth = 'md',
  disableSubmit = false,
  hideSubmitButton = false,
  hideCancelButton = false,
  extraActions = null,
  paperProps = {},
  ...rest
}) => {
  const theme = useTheme();
  
  return (
    <Box
      component="form"
      onSubmit={onSubmit}
      noValidate
      autoComplete="off"
      sx={{
        width: '100%',
        maxWidth: theme.breakpoints.values[maxWidth] || maxWidth,
        mx: 'auto',
        mb: 4
      }}
      {...rest}
    >
      <Paper
        elevation={1}
        sx={{
          p: { xs: 2, sm: 3 },
          borderRadius: 2,
          ...paperProps.sx
        }}
        {...paperProps}
      >
        {/* Form Header */}
        {(title || subtitle) && (
          <Box sx={{ mb: 3 }}>
            {title && (
              <Typography variant="h5" component="h1" fontWeight={600} gutterBottom>
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="body1" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            <Divider sx={{ mt: 2 }} />
          </Box>
        )}
        
        {/* Error or Success Messages */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}
        
        {/* Form Content */}
        <Box sx={{ mb: 3 }}>
          {children}
        </Box>
        
        {/* Form Actions */}
        {(!hideSubmitButton || !hideCancelButton || extraActions) && (
          <>
            <Divider sx={{ mb: 3 }} />
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                flexWrap: 'wrap',
                gap: 2
              }}
            >
              {extraActions && (
                <Box sx={{ flexGrow: 1, display: 'flex', gap: 1 }}>
                  {extraActions}
                </Box>
              )}
              
              {!hideCancelButton && onCancel && (
                <Button
                  onClick={onCancel}
                  variant="outlined"
                  color="inherit"
                  disabled={isLoading}
                >
                  {cancelLabel}
                </Button>
              )}
              
              {!hideSubmitButton && (
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={isLoading || disableSubmit}
                  startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                >
                  {isLoading ? 'Saving...' : submitLabel}
                </Button>
              )}
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
};

FormLayout.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  children: PropTypes.node.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  isLoading: PropTypes.bool,
  error: PropTypes.string,
  success: PropTypes.string,
  submitLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  maxWidth: PropTypes.oneOfType([
    PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
    PropTypes.string,
    PropTypes.number
  ]),
  disableSubmit: PropTypes.bool,
  hideSubmitButton: PropTypes.bool,
  hideCancelButton: PropTypes.bool,
  extraActions: PropTypes.node,
  paperProps: PropTypes.object
};

export default FormLayout; 