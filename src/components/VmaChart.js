import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const SVG_BACKGROUND_COLOR = "#202121";
const MARGIN = { top: 40, right: 40, bottom: 40, left: 40 };
const SVG_WIDTH = window.innerWidth - 60 || 1200;
const SVG_HEIGHT = window.innerHeight - 60 || 640;

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

function calculateDynamicYIncrement(numRectangles) {
  const minRectangleHeight = 20; // Minimum height for readability
  const maxRectangleHeight = 120;
  const dynamicGap = SVG_HEIGHT * 0.05; // Pecentage of the svg height

  // Calculate total padding based on dynamic gap size and number of rectangles
  const totalPadding = numRectangles * dynamicGap;
  const availableHeight = SVG_HEIGHT - totalPadding;
  let heightPerRectangle = availableHeight / numRectangles;

  // Apply minimum and maximum constraints to the rectangle height
  heightPerRectangle = Math.max(heightPerRectangle, minRectangleHeight);
  heightPerRectangle = Math.min(heightPerRectangle, maxRectangleHeight);

  // Return both the calculated rectangle height and gap
  return { height: heightPerRectangle, gap: dynamicGap };
}

function drawGroupRectangles(svg, groupDimensions) {
  const numRectangles = groupDimensions.length;
  const { height, gap } = calculateDynamicYIncrement(numRectangles);

  // Draw rectangles for each group
  const groups = svg.selectAll('.vma-group')
    .data(groupDimensions)
    .enter()
    .append('g') // Use a group to hold each rectangle and its labels
    .attr('class', 'vma-group');

  // Append rectangles to each group
  groups.append('rect')
    .attr('x', 0)
    .attr('y', (d, i) => i * (height + gap))
    .attr('width', d => d.width)
    .attr('height', height)
    .attr('fill', 'grey');

  groups.append('text')
    .attr('x', 0)
    .attr('y', (d, i) => i * (height + gap) - 5) // You may adjust this based on your needs
    .text(d => `${d.group[0].start} - ${d.group[d.group.length - 1].end}`)
    .attr('fill', 'white')
    .attr('font-size', `${Math.max(10, height / 5)}px`) // Example dynamic font size calculation
    .attr('text-anchor', 'start');
}

function visualizePagesWithinGroups(svg, groupDimensions, coloredAttribute, dynamicYIncrement) {
  const numRectangles = groupDimensions.length;
  const { height, gap } = calculateDynamicYIncrement(numRectangles, SVG_HEIGHT);

  groupDimensions.forEach((groupDim, groupIndex) => {
    const xOffset = 0;
    const yOffset = groupIndex * (height + gap);
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
        const color = (page[coloredAttribute] === 1) ? '#3ea345' : '#8f1a22';

        svg.append('rect')
        .attr('x', xOffset + (pageIndex * segmentWidth))
        .attr('y', yOffset)
        .attr('width', Math.max(segmentWidth, 1))
        .attr('height', height)
        .attr('fill', color)
        .attr('stroke-width', 0);

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
