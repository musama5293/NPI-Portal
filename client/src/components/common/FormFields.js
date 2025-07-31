import React from 'react';
import PropTypes from 'prop-types';
import {
  TextField,
  FormControl,
  FormHelperText,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Switch,
  Radio,
  RadioGroup,
  FormLabel,
  FormGroup,
  InputAdornment,
  IconButton,
  Box,
  Typography,
  Chip,
  Autocomplete,
  useTheme
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { Visibility, VisibilityOff } from '@mui/icons-material';

/**
 * Text Input Field with consistent styling and error handling
 */
export const FormTextField = ({
  name,
  label,
  value,
  onChange,
  error,
  type = 'text',
  required = false,
  fullWidth = true,
  placeholder,
  multiline = false,
  rows = 4,
  disabled = false,
  startAdornment,
  endAdornment,
  ...rest
}) => {
  return (
    <TextField
      name={name}
      label={label}
      value={value || ''}
      onChange={onChange}
      error={Boolean(error)}
      helperText={error}
      type={type}
      required={required}
      fullWidth={fullWidth}
      placeholder={placeholder}
      multiline={multiline}
      rows={multiline ? rows : undefined}
      disabled={disabled}
      variant="outlined"
      margin="normal"
      InputProps={{
        startAdornment: startAdornment && (
          <InputAdornment position="start">{startAdornment}</InputAdornment>
        ),
        endAdornment: endAdornment && (
          <InputAdornment position="end">{endAdornment}</InputAdornment>
        ),
      }}
      {...rest}
    />
  );
};

/**
 * Password Input Field with toggle visibility
 */
export const FormPasswordField = ({
  name,
  label,
  value,
  onChange,
  error,
  required = false,
  fullWidth = true,
  placeholder,
  disabled = false,
  ...rest
}) => {
  const [showPassword, setShowPassword] = React.useState(false);

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <TextField
      name={name}
      label={label}
      value={value || ''}
      onChange={onChange}
      error={Boolean(error)}
      helperText={error}
      type={showPassword ? 'text' : 'password'}
      required={required}
      fullWidth={fullWidth}
      placeholder={placeholder}
      disabled={disabled}
      variant="outlined"
      margin="normal"
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              aria-label="toggle password visibility"
              onClick={handleClickShowPassword}
              edge="end"
            >
              {showPassword ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
        ),
      }}
      {...rest}
    />
  );
};

/**
 * Select Field with consistent styling and error handling
 */
export const FormSelectField = ({
  name,
  label,
  value,
  onChange,
  error,
  options = [],
  required = false,
  fullWidth = true,
  disabled = false,
  emptyOption = true,
  ...rest
}) => {
  return (
    <FormControl
      variant="outlined"
      fullWidth={fullWidth}
      error={Boolean(error)}
      required={required}
      margin="normal"
      disabled={disabled}
    >
      <InputLabel id={`${name}-label`}>{label}</InputLabel>
      <Select
        labelId={`${name}-label`}
        id={name}
        name={name}
        value={value || ''}
        onChange={onChange}
        label={label}
        {...rest}
      >
        {emptyOption && <MenuItem value="">None</MenuItem>}
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  );
};

/**
 * Checkbox Field with consistent styling
 */
export const FormCheckbox = ({
  name,
  label,
  checked,
  onChange,
  disabled = false,
  ...rest
}) => {
  return (
    <FormControlLabel
      control={
        <Checkbox
          name={name}
          checked={Boolean(checked)}
          onChange={onChange}
          disabled={disabled}
          color="primary"
          {...rest}
        />
      }
      label={label}
    />
  );
};

/**
 * Switch Field with consistent styling
 */
export const FormSwitch = ({
  name,
  label,
  checked,
  onChange,
  disabled = false,
  ...rest
}) => {
  return (
    <FormControlLabel
      control={
        <Switch
          name={name}
          checked={Boolean(checked)}
          onChange={onChange}
          disabled={disabled}
          color="primary"
          {...rest}
        />
      }
      label={label}
    />
  );
};

/**
 * Radio Group Field with consistent styling
 */
export const FormRadioGroup = ({
  name,
  label,
  value,
  onChange,
  options = [],
  error,
  required = false,
  disabled = false,
  row = false,
  ...rest
}) => {
  return (
    <FormControl
      component="fieldset"
      error={Boolean(error)}
      required={required}
      margin="normal"
      disabled={disabled}
      fullWidth
    >
      <FormLabel component="legend">{label}</FormLabel>
      <RadioGroup
        name={name}
        value={value || ''}
        onChange={onChange}
        row={row}
        {...rest}
      >
        {options.map((option) => (
          <FormControlLabel
            key={option.value}
            value={option.value}
            control={<Radio color="primary" />}
            label={option.label}
          />
        ))}
      </RadioGroup>
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  );
};

/**
 * Checkbox Group Field with consistent styling
 */
export const FormCheckboxGroup = ({
  name,
  label,
  value = [],
  onChange,
  options = [],
  error,
  required = false,
  disabled = false,
  row = false,
  ...rest
}) => {
  const handleChange = (event) => {
    const optionValue = event.target.value;
    const newValue = [...value];
    
    if (event.target.checked) {
      if (!newValue.includes(optionValue)) {
        newValue.push(optionValue);
      }
    } else {
      const index = newValue.indexOf(optionValue);
      if (index !== -1) {
        newValue.splice(index, 1);
      }
    }
    
    onChange({
      target: {
        name,
        value: newValue
      }
    });
  };

  return (
    <FormControl
      component="fieldset"
      error={Boolean(error)}
      required={required}
      margin="normal"
      disabled={disabled}
      fullWidth
      {...rest}
    >
      <FormLabel component="legend">{label}</FormLabel>
      <FormGroup row={row}>
        {options.map((option) => (
          <FormControlLabel
            key={option.value}
            control={
              <Checkbox
                checked={value.includes(option.value)}
                onChange={handleChange}
                value={option.value}
                color="primary"
              />
            }
            label={option.label}
          />
        ))}
      </FormGroup>
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  );
};

/**
 * Date Picker Field with consistent styling
 */
export const FormDatePicker = ({
  name,
  label,
  value,
  onChange,
  error,
  required = false,
  fullWidth = true,
  disabled = false,
  ...rest
}) => {
  const handleChange = (date) => {
    onChange({
      target: {
        name,
        value: date
      }
    });
  };

  return (
    <DatePicker
      label={label}
      value={value || null}
      onChange={handleChange}
      disabled={disabled}
      slotProps={{
        textField: {
          name,
          variant: "outlined",
          fullWidth,
          margin: "normal",
          required,
          error: Boolean(error),
          helperText: error
        }
      }}
      {...rest}
    />
  );
};

/**
 * Autocomplete Field with consistent styling
 */
export const FormAutocomplete = ({
  name,
  label,
  value,
  onChange,
  options = [],
  error,
  required = false,
  fullWidth = true,
  disabled = false,
  multiple = false,
  freeSolo = false,
  ...rest
}) => {
  const handleChange = (event, newValue) => {
    onChange({
      target: {
        name,
        value: newValue
      }
    });
  };

  return (
    <Autocomplete
      id={name}
      options={options}
      value={value || (multiple ? [] : null)}
      onChange={handleChange}
      multiple={multiple}
      freeSolo={freeSolo}
      disabled={disabled}
      fullWidth={fullWidth}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          variant="outlined"
          required={required}
          error={Boolean(error)}
          helperText={error}
          margin="normal"
        />
      )}
      renderTags={(value, getTagProps) =>
        value.map((option, index) => (
          <Chip
            variant="outlined"
            label={option.label || option}
            {...getTagProps({ index })}
          />
        ))
      }
      {...rest}
    />
  );
};

/**
 * Form Section with title and optional description
 */
export const FormSection = ({
  title,
  description,
  children,
  divider = true,
  ...rest
}) => {
  const theme = useTheme();
  
  return (
    <Box sx={{ mb: 4 }} {...rest}>
      {title && (
        <Typography 
          variant="h6" 
          component="h2" 
          fontWeight={600} 
          gutterBottom
          color="primary"
        >
          {title}
        </Typography>
      )}
      {description && (
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ mb: 2 }}
        >
          {description}
        </Typography>
      )}
      <Box sx={{ mb: 2 }}>
        {children}
      </Box>
      {divider && (
        <Box 
          sx={{ 
            borderTop: `1px solid ${theme.palette.divider}`,
            mt: 3
          }} 
        />
      )}
    </Box>
  );
};

// PropTypes
FormTextField.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
  type: PropTypes.string,
  required: PropTypes.bool,
  fullWidth: PropTypes.bool,
  placeholder: PropTypes.string,
  multiline: PropTypes.bool,
  rows: PropTypes.number,
  disabled: PropTypes.bool,
  startAdornment: PropTypes.node,
  endAdornment: PropTypes.node
};

FormPasswordField.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
  required: PropTypes.bool,
  fullWidth: PropTypes.bool,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool
};

FormSelectField.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.any.isRequired,
      label: PropTypes.string.isRequired
    })
  ),
  error: PropTypes.string,
  required: PropTypes.bool,
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  emptyOption: PropTypes.bool
};

FormCheckbox.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  checked: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

FormSwitch.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  checked: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

FormRadioGroup.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.any.isRequired,
      label: PropTypes.string.isRequired
    })
  ),
  error: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  row: PropTypes.bool
};

FormCheckboxGroup.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.array,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.any.isRequired,
      label: PropTypes.string.isRequired
    })
  ),
  error: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  row: PropTypes.bool
};

FormDatePicker.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
  required: PropTypes.bool,
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool
};

FormAutocomplete.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.array,
  error: PropTypes.string,
  required: PropTypes.bool,
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  multiple: PropTypes.bool,
  freeSolo: PropTypes.bool
};

FormSection.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  children: PropTypes.node.isRequired,
  divider: PropTypes.bool
}; 