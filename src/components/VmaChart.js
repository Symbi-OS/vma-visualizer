import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const SVG_BACKGROUND_COLOR = "#202121";
const MARGIN = { top: 40, right: 40, bottom: 40, left: 40 };
const SVG_WIDTH = 1200;
const SVG_HEIGHT = 640;

const RECTANGLE_Y_INCREMENT_OFFSET = 50;

const PAGE_GROUPING_GAP_LIMIT = 0x10000;

function groupVMAs(vmas) {
  // Sort VMAs by their start address
  vmas.sort((a, b) => parseInt(a.start, 16) - parseInt(b.start, 16));

  const groupedVMAs = [];
  let currentGroup = [vmas[0]];

  for (let i = 1; i < vmas.length; i++) {
      const currentVMA = vmas[i];
      const lastVMAInGroup = currentGroup[currentGroup.length - 1];
      
      // Check if the current VMA is within certain number of bytes (inclusive) of the last VMA in the current group
      if (parseInt(currentVMA.start, 16) - parseInt(lastVMAInGroup.end, 16) <= PAGE_GROUPING_GAP_LIMIT) {
          currentGroup.push(currentVMA);
      } else {
          groupedVMAs.push(currentGroup);
          currentGroup = [currentVMA];
      }
  }

  // Don't forget to add the last group if it's not empty
  if (currentGroup.length > 0) {
      groupedVMAs.push(currentGroup);
  }

  return groupedVMAs;
}

function calculateGroupDimensions(groupedVMAs, maxAddressRange) {
  const widthScale = d3.scaleLinear()
    .domain([0, maxAddressRange])
    .range([0, SVG_WIDTH - MARGIN.left - MARGIN.right]);

  return groupedVMAs.map(group => {
    const rangeStart = parseInt(group[0].start, 16);
    const rangeEnd = parseInt(group[group.length - 1].end, 16);
    const width = widthScale(rangeEnd - rangeStart);

    return { width, group };
  });
}

function drawGroupRectangles(svg, groupDimensions) {
  // Draw rectangles for each group
  const groups = svg.selectAll('.vma-group')
    .data(groupDimensions)
    .enter()
    .append('g') // Use a group to hold each rectangle and its labels
    .attr('class', 'vma-group');

  // Append rectangles to each group
  groups.append('rect')
    .attr('x', 0)
    .attr('y', (d, i) => i * RECTANGLE_Y_INCREMENT_OFFSET)
    .attr('width', d => d.width)
    .attr('height', 20) // Static height for simplicity
    .attr('fill', 'grey'); // Default color

  groups.append('text')
    .attr('x', 0) // Offset from the start of the rectangle
    .attr('y', (d, i) => i * RECTANGLE_Y_INCREMENT_OFFSET - 5) // Position text above the rectangle
    .text(d => `${d.group[0].start} - ${d.group[d.group.length - 1].end}`)
    .attr('fill', 'white')
    .attr('font-size', '10px')
    .attr('text-anchor', 'start');
}

function visualizePagesWithinGroups(svg, groupDimensions, coloredAttribute) {
  groupDimensions.forEach((groupDim, groupIndex) => {
    const xOffset = 0; // Starting x offset within the rectangle
    const yOffset = groupIndex * RECTANGLE_Y_INCREMENT_OFFSET; // Adjust based on your layout
    let pageIndex = 0;

    let totalVmaGroupPageCount = 0;
    groupDim.group.forEach(vma => {
      totalVmaGroupPageCount += vma.pagesInVMA
    })

    groupDim.group.forEach(vma => {
      const groupWidth = groupDim.width; // Use the width of the VMA group rectangle
      const numPages = vma.pagesInVMA;
      const segmentWidth = groupWidth / totalVmaGroupPageCount;

      for (let i = 0; i < numPages; i++) {
        const page = vma.pages[i];
        const color = (page[coloredAttribute] === 1) ? 'green' : 'red';

        svg.append('rect')
          .attr('x', xOffset + (pageIndex * segmentWidth))
          .attr('y', yOffset)
          .attr('width', Math.max(segmentWidth, 1)) // Ensure segment is at least 1px wide
          .attr('height', 20) // Static height for simplicity
          .attr('fill', color);

        pageIndex++;
      }
    });
  });
}

const VmaChart = ({ vmaData }) => {
  const d3Container = useRef(null);

  useEffect(() => {
    if (vmaData && d3Container.current) {
      // Clear the container before drawing
      d3.select(d3Container.current).selectAll("*").remove();

      // Create the SVG container for the chart, set its dimensions and background color
      const svg = d3.select(d3Container.current)
        .append('svg')
        .attr('width', SVG_WIDTH)
        .attr('height', SVG_HEIGHT)
        .style('background-color', SVG_BACKGROUND_COLOR)
        .append('g')
        .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

      // Group the VMAs
      const groupedVMAs = groupVMAs(vmaData);

      // Calculate the maximum address range for scaling
      const maxAddressRange = groupedVMAs.reduce((max, group) => {
        const rangeStart = parseInt(group[0].start, 16);
        const rangeEnd = parseInt(group[group.length - 1].end, 16);
        const range = rangeEnd - rangeStart;
        return range > max ? range : max;
      }, 0);

      // Calculate dimensions for each group
      const groupDimensions = calculateGroupDimensions(groupedVMAs, maxAddressRange);

      // Draw rectangles for each group
      drawGroupRectangles(svg, groupDimensions);

      // After drawing VMA group rectangles...
      visualizePagesWithinGroups(svg, groupDimensions, 'present');
    }
  }, [vmaData]);

  return (
    <div className="d3-component" ref={d3Container} />
  );
};

export default VmaChart;
