'use strict';

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
          'babelify'
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

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-postcss');

  grunt.registerTask('default',
                     ['clean',
                      'browserify',
                      'jshint',
                      'qunit',
                      'uglify',
                      'less',
                      'postcss']);
};
