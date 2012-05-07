(function() {
  var addDocExamples, extractBlocks, fs, highlight, makeSections, marked, parser, splitter, styleHighlighter, _;
 
  fs = require('fs');

  highlight = require('highlight.js');

  marked = require('marked');

  _ = require('./utils');

  marked.setOptions({
    sanitize: false,
    gfm: true
  });

  extractBlocks = exports.extractBlocks = function(lang, data) {
    var code, docs, formatCode, formatDocs, line, lines, sections;
    lines = data.split('\n');
    sections = [];
    formatCode = function(line) {
      return "" + (line.replace(/(;base64,)[^\)]*/, '$1...')) + "\n";
    };
    formatDocs = function(line) {
      return "" + (lang.filter(line)) + "\n";
    };
    while (lines.length) {
      docs = code = '';
      while (lines.length && lang.checkType(lines[0]) === 'single') {
        docs += formatDocs(lines.shift());
      }
      if (lines.length && lang.checkType(lines[0]) === 'multistart') {
        while (lines.length) {
          line = lines.shift();
          docs += formatDocs(line);
          if (lang.checkType(line) === 'multiend') break;
        }
      }
      while (lines.length && (lang.checkType(lines[0]) === 'code' || lang.checkType(lines[0]) === 'multiend')) {
        code += formatCode(lines.shift());
      }
      sections.push({
        docs: docs,
        code: code
      });
    }
    return sections;
  };

  makeSections = exports.makeSections = function(blocks) {
    return blocks.map(function(block) {
      return {
        docs: marked.lexer(block.docs),
        code: styleHighlighter(block.code)
      };
    }).map(addDocExamples, []).reduce(splitter, []).map(parser);
  };

  addDocExamples = function(block) {
    block.docs = block.docs.reduce(function(tokens, token) {
      if (token.type === 'code') {
        tokens.push({
          type: 'html',
          pre: true,
          text: "<div class=\"styledocco-example\">" + token.text + "</div>"
        });
        token.text = highlight.highlightAuto(token.text).value;
        token.escaped = true;
      }
      tokens.push(token);
      return tokens;
    }, []);
    return block;
  };

  splitter = function(sections, cur, i) {
    var doc, _i, _len, _ref;
    _ref = cur.docs;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      doc = _ref[_i];
      if (sections.length === 0 || (doc.type === 'heading' && doc.depth <= 2)) {
        sections.push({
          docs: [doc],
          code: ''
        });
      } else {
        sections[sections.length - 1].docs.push(doc);
      }
    }
    if (sections.length === 0) {
      sections.push(cur);
    } else {
      sections[sections.length - 1].code += cur.code;
    }
    return sections;
  };

  parser = function(block) {
	var title = []
	if(block.docs.length !== 0){
		title.push(block.docs[0].text);
	}
    return {
      docs: _.trimNewLines(marked.parser(block.docs)),
      code: _.trimNewLines(block.code),
	  title:title
    };
  };

  styleHighlighter = function(code) {
    return highlight.highlight('css', code).value;
  };

}).call(this);
