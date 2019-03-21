import React from 'react'
import { render } from 'react-dom'
import * as d3 from 'd3'

import rules from './rules'
import './styles.scss'

class CellularAutomata extends React.Component {
  static defaultProps = {
    stateRules: [[1,1,1], [1,1,0], [1,0,1], [1,0,0], [0,1,1], [0,1,0], [0,0,1], [0,0,0]]
  }

  constructor(props) {
    super(props)
    addArrayEqualityMethod();

    function addArrayEqualityMethod() {
      Array.prototype.equals = function (array) {
        for (var i = 0, l=this.length; i < l; i++) {
          if (this[i] != array[i]) return false;
        }
        return true;
      }
    }

    this.state = {
      ruleNumber: '30',
      rule: rules.rule30.slice(),
      newRule: rules.rule30.slice(),
      scale: 13,
      width: undefined,
      height: 80,
    }
  }

  componentDidMount() {
    const { scale } = this.state;
    const svgContainerWidth = document.querySelector('.svg-container').clientWidth;
    const initialWidth = svgContainerWidth - (svgContainerWidth % scale) - scale;
    this.setState({ width: initialWidth }, () => this.generateRule())
  }

  generateRule = () => {
    const { scale, width, height } = this.state;

    let svg_dx = width,
        svg_dy = scale * height,
        n_cols = this.isOdd(svg_dx, scale),
        n_rows = height,
        rows = d3.range(n_rows),
        cols = d3.range(n_cols),
        cells = d3.cross(rows, cols, (row, col) => {
          return {'row': row, 'col': col, 'state': 0};
        });

    cells[Math.round(n_cols/2)-1].state = 1; // set initial state of cell in first row, center col to 1

    d3.select('.svg-container').selectAll('svg').remove(); // destroy previous states
    let svg = d3.select('.svg-container')
                .append('svg')
                .attr('width', svg_dx)
                .attr('height', svg_dy);

    // plot rects
    svg.selectAll('rect')
       .data(cells)
       .enter()
       .append('rect')
       .attr('class', this.assignClass)
       .attr('x', cell => cell.col * scale)
       .attr('y', cell => cell.row * scale)
       .attr('height', scale - 1)
       .attr('width', scale - 1)

    // update cell states for each row
    rows.forEach(row => {
      d3.selectAll('.row_' + row)
        .call(this.plotStates, row)
    });
  }

  isOdd = (svg_dx, scale) => {
    if ((svg_dx / scale) % 2) return svg_dx / scale
    return (svg_dx / scale)-1
  }

  assignClass = (cell) => {
    return 'row_' + cell.row + (cell.state == 1 ? ' state_1' : ' state_0');
  }

  plotStates = (selection, row) => {
    let old_states = selection.data().map(cell => cell.state),
        new_states = this.computeNewState(old_states);

    // update next row
    // NB: arrow function does not bind 'this'
    function renderCellColors(assignClass) {
      d3.selectAll('.row_' + (row + 1))
        .each(function(cell, i) {
          cell.state = new_states[i];
          d3.select(this)
            .transition()
            .delay(() => row * 50)
            .attr('class', assignClass);
        });
    }
    renderCellColors(this.assignClass);
  }

  computeNewState = (states) => {
    const { rule } = this.state;
    let new_states = [0]; // state of first cell remains 0

    // NB: loop begins at second element in array and end at second
    //     to last element in array; state for first and last elements
    //     in array remain 0
    for (let i = 1; i < states.length - 1; i++) {
      // NB: slice end not included
      let context = states.slice(i - 1, i + 2);

      if (context.equals([1, 1, 1])) {
        new_states.push(rule[0]);
      } else if (context.equals([1, 1, 0])) {
        new_states.push(rule[1]);
      } else if (context.equals([1, 0, 1])) {
        new_states.push(rule[2]);
      } else if (context.equals([1, 0, 0])) {
        new_states.push(rule[3]);
      } else if (context.equals([0, 1, 1])) {
        new_states.push(rule[4]);
      } else if (context.equals([0, 1, 0])) {
        new_states.push(rule[5]);
      } else if (context.equals([0, 0, 1])) {
        new_states.push(rule[6]);
      } else if (context.equals([0, 0, 0])) {
        new_states.push(rule[7]);
      }
    }

    new_states.push(0); // state of last cell remains 0
    return new_states;
  }

  toggleStateRule = (index) => {
    const { newRule } = this.state;
    newRule[index] = newRule[index] ? 0 : 1;
    let ruleNumber;
    for (const key in rules) {
      if (rules[key].equals(newRule)) {
        ruleNumber = key.slice(4);
        break
      }
    }
    this.setState({ ruleNumber, newRule });
  }

  generateNewRule = () => {
    const { rule, newRule } = this.state;
    if (!rule.equals(newRule)) this.setState({ rule: newRule.slice() }, () => this.generateRule())
  }

  render() {
    const { stateRules } = this.props;
    const { ruleNumber, rule, newRule, scale, width, height } = this.state;

    return(
      <div className='container'>
        <div className='controls-container'>
          <div className={rule.equals(newRule)?'generated-btn':'not-generated-btn'}
            onClick={() => this.generateNewRule()}>Rule {ruleNumber}</div>
        </div>

        <div className='rules-controls'>
          {newRule.map((item, index) => <div key={index} className='rule-control'>
            <div className='rule-control-btn'
              onClick={() => this.toggleStateRule(index)}>
              <div className='rule-desc-container'>
                <div className={stateRules[index][0]?'state-on':'state-off'}></div>
                <div className={stateRules[index][1]?'state-on':'state-off'}></div>
                <div className={stateRules[index][2]?'state-on':'state-off'}></div>
              </div>
              <div className={item?'state-on':'state-off'}></div>
            </div>
            <div className='rule-desc-bool'>{item}</div>
          </div>)}
        </div>

        <div className='svg-container'></div>
      </div>
    )
  }
}

render(
  <CellularAutomata/>, document.getElementById('root')
)
