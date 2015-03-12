'use strict';
// compile all .js files except the ones coming from node_modules
var es6ify = require('es6ify');
es6ify.configure(/^(?!.*node_modules)+.+\.js$/);

module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %>;' +
      ' Licensed <%= pkg.license %> */\n',
    clean: {
      files: ['dist']
    },
    uglify: {
      options: {
        banner: '<%= banner %>',
        report: 'gzip'
      },
      dist: {
        src: '<%= browserify.src.dest %>',
        dest: 'dist/<%= pkg.name %>.min.js'
      }
    },
    qunit: {
      files: 'test/**/*.html'
    },
    jshint: {
      gruntfile: {
        options: {
          node: true
        },
        src: 'Gruntfile.js'
      },
      src: {
        options: {
          jshintrc: '.jshintrc'
        },
        src: ['lib/**/*.js']
      },
      test: {
        options: {
          jshintrc: 'test/.jshintrc'
        },
        src: ['test/**/*.js']
      }
    },
    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      src: {
        files: '<%= jshint.src.src %>',
        tasks: ['jshint:src', 'browserify:src', 'qunit']
      },
      test: {
        files: '<%= jshint.test.src %>',
        tasks: ['jshint:test', 'browserify:test', 'qunit']
      }
    },
    connect: {
      dev: {
        options: {
          hostname: '*',
          port: 9898,
          keepalive: true
        }
      }
    },

    browserify: {
      options: {
        banner: '<%= banner %>',
        transform: [
          es6ify
        ],
        configure: function(browserify) {
          console.log(es6ify.runtime);
          browserify.add(es6ify.runtime);
        }
      },
      src: {
        src: ['lib/videojs-playlist-ui.js'],
        dest: 'dist/videojs-playlist-ui.js'
      },
      test: {
        src: ['test/**/*.js'],
        dest: 'dist/videojs-playlist-ui.test.js'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.loadNpmTasks('grunt-browserify');

  grunt.registerTask('default',
                     ['clean',
                      'browserify',
                      'jshint',
                      'qunit',
                      'uglify']);
};
