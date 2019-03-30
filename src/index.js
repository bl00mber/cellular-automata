import React from 'react'
import { render } from 'react-dom'
import * as d3 from 'd3'
import { Switch, FormControlLabel, TextField, Button } from '@material-ui/core'
import GridDropdown from 'react-grid-dropdown'

import rules from './rules'
import './styles.scss'

class CellularAutomata extends React.Component {
  static defaultProps = {
    stateRules: [[1,1,1], [1,1,0], [1,0,1], [1,0,0], [0,1,1], [0,1,0], [0,0,1], [0,0,0]],
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
      rulesForDropdown: this.getRulesForDropdown(),
      activeDropdownItem: 'rule30',
      controlsChanged: false,
      ruleNumber: '30',
      rule: rules.rule30.slice(),
      scale: 13,
      width: 0,
      heightRows: 80, //80
      singleCell: true,
    }
  }

  componentDidMount() {
    const { scale } = this.state;
    const svgContainerWidth = document.querySelector('.svg-container').clientWidth;
    const initialWidth = svgContainerWidth - (svgContainerWidth % scale) - scale;
    this.setState({ width: initialWidth }, () => this.generateRule())
  }

  getRandomInt = (max) => Math.floor(Math.random() * Math.floor(max))

  generateRule = () => {
    const { scale, width, heightRows, singleCell } = this.state;

    let svg_dx = width,
        svg_dy = scale * heightRows,
        n_cols = this.isOdd(svg_dx, scale),
        n_rows = heightRows,
        rows = d3.range(n_rows),
        cols = d3.range(n_cols),
        cells = d3.cross(rows, cols, (row, col) => {
          return {'row': row, 'col': col, 'state': 0};
        });

    if (singleCell) {
      cells[Math.round(n_cols/2)-1].state = 1; // set initial state of cell in first row, center col to 1
    } else {
      const cellsToBeFilled = this.getRandomInt(n_cols);
      for (let i = 1; i < cellsToBeFilled; i++) {
        const cellIndex = this.getRandomInt(n_cols);
        cells[cellIndex].state = 1;
      }
    }

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
    for (let i = 0; i < rows.length; i++) {
      d3.selectAll('.row_' + rows[i])
        .call(this.plotStates, rows[i])
    }
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
    const { rule } = this.state;
    rule[index] = rule[index] ? 0 : 1;
    let ruleNumber;
    for (const key in rules) {
      if (rules[key].equals(rule)) {
        ruleNumber = key.slice(4);
        break
      }
    }
    this.setState({ controlsChanged: true, ruleNumber, rule });
  }

  toggleBoolean = (key) => this.setState({ controlsChanged: true, [key]: !this.state[key] })

  handleChange = (key, value) => this.setState({ controlsChanged: true, [key]: value })

  setRandomRule = () => {
    const ruleIndex = this.getRandomInt(Object.keys(rules).length);
    const key = Object.keys(rules)[ruleIndex];
    const ruleNumber = key.slice(4);
    this.setState({ controlsChanged: true, ruleNumber, rule: rules[key] })
  }

  getRulesForDropdown = () => {
    const items = [];

    for (const key in rules) {
      const id = key;
      const ruleNumber = id.slice(4);
      const label = 'RULE '+ruleNumber;

      let category;
      if (['rule30', 'rule90', 'rule110', 'rule184'].includes(id)) { category = 'most interesting rules' }
      else if (['rule18', 'rule45', 'rule60', 'rule62', 'rule73', 'rule75', 'rule86', 'rule89', 'rule101', 'rule102', 'rule105', 'rule124', 'rule129', 'rule131', 'rule135', 'rule137', 'rule145', 'rule149', 'rule150', 'rule153', 'rule169', 'rule193', 'rule225'].includes(id)) { category = 'interesting rules'}
      else { category = 'other rules' }

      items.push({section: category, label, id, onClick: () =>
        this.setState({ controlsChanged: true, ruleNumber, rule: rules['rule'+ruleNumber] })})
    }

    return items
  }

  render() {
    const { stateRules } = this.props;
    const { rulesForDropdown, controlsChanged, ruleNumber, rule, scale, width, heightRows, singleCell } = this.state;

    return(
      <div className="container">
        <div className="controls-container">
          <GridDropdown
            label="rules"
            activeItem={'rule'+ruleNumber}
            items={rulesForDropdown}
            sectionsOrder={['most interesting rules', 'interesting rules', 'other rules']}
            buttonStyle={{margin: '2px 23px 0 0'}}
            dropdownStyle={{width: '975px', height: '485px'}}
          />

          <FormControlLabel
            control={
              <Switch
                disableRipple
                checked={singleCell}
                onChange={() => this.toggleBoolean('singleCell')}
              />
            }
            label={singleCell?'Single Cell':'Random'}
          />

          <div className={(controlsChanged || !singleCell)?'not-generated-btn':'generated-btn'}
              onClick={() => {if (controlsChanged || !singleCell) this.setState({ controlsChanged: false }, () => this.generateRule())}}>
              Rule {ruleNumber}
          </div>

          <TextField
            label="Scale"
            value={scale}
            onChange={e => this.handleChange('scale', e.target.value)}
            margin="normal"
          />
          <TextField
            label="Height"
            value={heightRows}
            onChange={e => this.handleChange('heightRows', e.target.value)}
            margin="normal"
          />

          <Button variant="outlined" onClick={() => this.setRandomRule()}>
            Random Rule
          </Button>

          <div className="authorship">Developed by <a href="https://github.com/bl00mber/cellular-automata">bl00mber</a></div>
        </div>

        <div className="rules-controls">
          {rule.map((item, index) => <div key={index} className="rule-control">
            <div className="rule-control-btn"
              onClick={() => this.toggleStateRule(index)}>
              <div className="rule-desc-container">
                <div className={stateRules[index][0]?'state-on':'state-off'}></div>
                <div className={stateRules[index][1]?'state-on':'state-off'}></div>
                <div className={stateRules[index][2]?'state-on':'state-off'}></div>
              </div>
              <div className={item?'state-on':'state-off'}></div>
            </div>
            <div className="rule-desc-bool">{item}</div>
          </div>)}
        </div>

        <div className="svg-container"></div>
      </div>
    )
  }
}

render(
  <CellularAutomata/>, document.getElementById('root')
)
