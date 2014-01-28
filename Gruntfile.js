'use strict';

module.exports = function(grunt) {

  grunt.initConfig({

    clean: {
        build: ['build/']
    },

    copy: {
        assets: {
            files: [
                { expand: true, src: [ 'fonts/**' ], dest: 'build/' },
                { expand: true, src: [ 'js/**' ], dest: 'build/' },
                { expand: true, src: [ 'index.html' ], dest: 'build/' }
            ]
        },
    },

    // LESS conversion
    less: {
      options: {
        yuicompress: true
      },
      default:  {
        files: {
          'build/css/main.min.css': 'less/main.less'
        }
      }
    },

    // watch
    watch: {
      files: "less/*.less",
      tasks: ["less"]
    },

    // static file server
    connect: {
      server: {
        options: {
          port: 8080,
          keepalive: true,
          base: 'build'
        }
      }
    }

  });

  // load tasks from npm
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');

  grunt.registerTask('default', ['clean', 'copy', 'less']);

};
