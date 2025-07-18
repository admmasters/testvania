# HUD Layout Enhancement Design

## Overview

The current HUD layout has issues with text overflow, particularly with the MP display. This design document outlines a comprehensive approach to improve the HUD layout to ensure all information is properly contained and visually appealing.

## Architecture

The HUD will maintain its current component-based architecture but with improved layout and rendering techniques:

1. **Main Panel**: Contains all HUD elements
2. **Level Display**: Shows player level
3. **Stat Boxes**: Contains HP and MP displays
4. **Power Bar**: Shows player power/energy

## Components and Interfaces

### HUD Layout Improvements

1. **Redesigned Stat Boxes**:
   - Increase the width of the MP box to accommodate larger numbers
   - Implement a more compact display format for MP values
   - Ensure consistent spacing between elements

2. **Text Rendering Enhancements**:
   - Implement text truncation or abbreviation for large numbers
   - Use a more space-efficient font rendering approach
   - Add text clipping to prevent overflow

3. **Visual Consistency**:
   - Maintain consistent styling across all HUD elements
   - Ensure proper alignment and padding
   - Implement responsive sizing based on content

## Data Models

No changes to the underlying data models are required. The improvements focus on the rendering and layout aspects of the HUD.

## Detailed Design

### 1. MP Display Format Changes

The current format `"34/100"` can overflow when values increase. We'll implement these changes:

1. **Option 1: Abbreviated Format**
   - For large values, use abbreviated format: "34/100" becomes "34/1H" (where H = hundred)
   - For very large values: "1.2K/5K" (where K = thousand)

2. **Option 2: Separate Display**
   - Display current and max values on separate lines
   - Current: "34"
   - Max: "/100"

3. **Option 3: Wider MP Box**
   - Increase the MP box width from 42px to 50px
   - Adjust the layout to maintain visual balance

4. **Option 4: Percentage Display**
   - For high values, show percentage instead: "34%" (meaning 34% of max MP)
   - Toggle between formats based on value length

### 2. Layout Adjustments

1. **Box Dimensions**:
   - HP Box: 42px width (unchanged)
   - MP Box: 50px width (increased)
   - Adjust spacing between boxes to maintain visual harmony

2. **Panel Size**:
   - Increase overall panel width from 110px to 120px
   - Maintain panel height at 108px

3. **Text Positioning**:
   - Center-align text within each box
   - Implement text clipping with ellipsis for overflow

### 3. Visual Enhancements

1. **Text Rendering**:
   - Implement a more efficient text rendering technique
   - Use a slightly smaller base font size for stat values (14px instead of 16px)
   - Reduce glow effect radius to prevent bleeding

2. **Color Coding**:
   - Maintain current color scheme for visual consistency
   - Ensure color transitions are smooth when values change

## Error Handling

1. Implement text measurement before rendering to detect potential overflow
2. Apply appropriate text formatting strategy based on text width
3. Add fallback rendering options for extreme cases

## Testing Strategy

1. **Unit Tests**:
   - Test text formatting functions with various input values
   - Verify text containment within boundaries

2. **Visual Tests**:
   - Test with various MP values (small, medium, large)
   - Verify rendering at different resolutions
   - Ensure visual consistency across different game states

3. **Edge Cases**:
   - Test with maximum possible MP values
   - Test with rapidly changing values
   - Test with different aspect ratios