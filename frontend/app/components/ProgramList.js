var React = require('react');
var ProgramStore = require('ProgramStore');
var actions = require('actions');

var ReactRouter = require('react-router');
var Link = ReactRouter.Link;

var FrontpageSidebar = require('./FrontpageSidebar');

var ProgramList = React.createClass({
    getInitialState: function() {
        return {
            programs: ProgramStore.getPrograms()
        };
    },
    componentWillMount: function() {
        ProgramStore.addChangeListener(this.changeState);
    },
    componentWillUnmount: function() {
        ProgramStore.removeChangeListener(this.changeState);
    },
    changeState: function() {
        this.setState({
            programs: ProgramStore.getPrograms()
        });
    },
    renderProgram: function(program) {
        var slug = program.slug;
        var id = slug + "-row";
        var lead = "Dette programmet har ikke skrevet infotekst om seg selv.";
        if (program.lead.length > 0) {
            lead = program.lead;
        }

        const blocks = JSON.parse(program.body);
        const imageURL = blocks.filter((val) => {return val.type == "image"})[0].data.file.url;

        return (
            <div id={ id } className="col-xs-12 col-md-6 program-list-element">
                <div className="row">
                    <div className="program-logo col-md-4"><img src={imageURL} style={{'width':170,'height':170}} /></div>
                    <div className="program-name col-md-8">
                        <h3><Link to={`/${ program.slug }`}>{ program.name }</Link></h3>
                        <p>{ program.lead }</p>
                    </div>
                </div>
            </div>
        );
    },
    render: function() {
        let programs = this.state.programs.map(this.renderProgram);

        return (
            <div id="program-list-wrapper">
            	<div id="content-block-body" className="col-md-12">
                    <div className="row">
            		  { programs }
                    </div>
            	</div>
            </div>
           );
    }
});

module.exports = ProgramList;