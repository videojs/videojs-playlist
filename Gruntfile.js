'use strict';

var loadGruntTasks = require('load-grunt-tasks');
var cli = require('shelljs-nodecli');
var sh = require('shelljs');

module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %>;' +
      ' Licensed <%= pkg.license %> */\n',
    clean: {
      files: ['dist', 'es5']
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
    less: {
      dist: {
        files: {
          'dist/videojs-playlist-ui.vertical.no-prefix.css': 'lib/videojs-playlist-ui.vertical.less'
        }
      }
    },
    postcss: {
      options: {
        processors: [
          require('autoprefixer-core')({
            browsers: ['last 2 versions', 'ie 8', 'ie 9']
          }),
          require('postcss-pseudoelements')()
        ]
      },
      dist: {
        src: 'dist/videojs-playlist-ui.vertical.no-prefix.css',
        dest: 'dist/videojs-playlist-ui.vertical.css'
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
        files: ['<%= jshint.src.src %>', 'lib/*.less'],
        tasks: ['less', 'postcss', 'jshint:src', 'browserify:src', 'qunit']
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
          'babelify',
          'browserify-shim'
        ]
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

  loadGruntTasks(grunt);

  grunt.registerTask('babel', function() {
    sh.mkdir('-p', 'es5');
    cli.exec('babel', 'lib', '-d es5');
  });

  grunt.registerTask('build-js', ['babel', 'browserify', 'uglify']);
  grunt.registerTask('build-js:dist', ['babel', 'browserify:src', 'uglify']);
  grunt.registerTask('build-css', ['less', 'postcss']);

  grunt.registerTask('build:dist', ['clean', 'build-js:dist', 'build-css']);
  grunt.registerTask('build', ['clean', 'build-js', 'build-css']);
  grunt.registerTask('test', ['build', 'jshint', 'qunit']);

  grunt.registerTask('default', ['build', 'test']);
};
