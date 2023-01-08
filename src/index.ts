#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import * as inquirer from 'inquirer';
import * as chalk from 'chalk';
import * as template from './utils/template';
import * as shell from 'shelljs';

const CHOICES = fs.readdirSync(path.join(__dirname, 'templates'));
const QUESTIONS = [
   {
      name: 'template',
      type: 'list',
      message: 'What template would you like to use?',
      choices: CHOICES
   },
   {
      name: 'name',
      type: 'input',
      message: 'Please input a new project name:'
   }];

export interface CliOptions {
   projectName: string
   templateName: string
   templatePath: string
   tartgetPath: string
}

const CURR_DIR = process.cwd() + '/run';

inquirer.prompt(QUESTIONS).then(answers => {
   const projectChoice = answers['template'];
   const projectName = answers['name'];
   //@ts-ignore
   const templatePath = path.join(__dirname, 'templates', projectChoice);
   //@ts-ignore
   const tartgetPath = path.join(CURR_DIR, projectName);

   const options: CliOptions = {
      //@ts-ignore
      projectName,
      //@ts-ignore
      templateName: projectChoice,
      templatePath,
      tartgetPath
   }

   if (!createProject(tartgetPath)) {
      return;
   }

   //@ts-ignore
   createDirectoryContents(templatePath, projectName);

   postProcess(options);
});

function createProject(projectPath: string) {
   if (fs.existsSync(projectPath)) {
      console.log(chalk.red(`Folder ${projectPath} exists. Delete or use another name.`));
      return false;
   }
   fs.mkdirSync(projectPath);

   return true;
}

/**
 * Processes a template file to find fields to replace
 *
 * Matches ejs tags like <%= projectName %>
 * or conditional ternary operators like <%= projectName ? 'yes' : 'no' %> or
 * short ternary operators like <%= projectName ?? 'no' %> where only the first
 * value is used if it is not null or undefined
 *
 * @param content
 * @returns {string[]}
 */
function parseFieldsToReplace(content: string) {
   const fields = content.match(/<%=\s[a-zA-Z]+/g);
   if (!fields) {
      return [];
   }
   return fields.map(field => {
      return field.replace(/<%=\s*|\s*%>/g, '');
   });
}

/**
 * Prompts the user for the values of the fields to replace
 * during the template creation process
 *
 * @param fields
 * @returns {Promise<any>}
   */
function promptForMissingOptions(fields: string[]) {
   const questions: any[] = [];
   fields.forEach(field => {
      questions.push({
         type: 'input',
         name: field,
         message: `Please enter a value for ${field}:`
      });
   });
   return inquirer.prompt(questions);
}

const SKIP_FILES = ['node_modules', '.template.json'];

function createDirectoryContents(templatePath: string, projectName: string) {
   // read all files/folders (1 level) from template folder
   const filesToCreate = fs.readdirSync(templatePath);
   // loop each file/folder
   filesToCreate.forEach(file => {
      const origFilePath = path.join(templatePath, file);

      // get stats about the current file
      const stats = fs.statSync(origFilePath);

      // skip files that should not be copied
      if (SKIP_FILES.indexOf(file) > -1) return;

      if (stats.isFile()) {
         // read file content and transform it using template engine
         let contents = fs.readFileSync(origFilePath, 'utf8');

         // replace fields with actual values
         const fields = parseFieldsToReplace(contents);
         console.log(fields);
         if (fields.length) {
            promptForMissingOptions(fields).then(answers => {
               contents = template.render(contents, answers);
               // write file to destination folder
               const writePath = path.join(CURR_DIR, projectName, file);
               fs.writeFileSync(writePath, contents, 'utf8');
            });
         } else {
            // write file to destination folder
            const writePath = path.join(CURR_DIR, projectName, file);
            fs.writeFileSync(writePath, contents, 'utf8');
         }
      } else if (stats.isDirectory()) {
         // create folder in destination folder
         fs.mkdirSync(path.join(CURR_DIR, projectName, file));
         // copy files/folder inside current folder recursively
         createDirectoryContents(path.join(templatePath, file), path.join(projectName, file));
      }
   });
}

function postProcess(options: CliOptions) {
   return true;
   // const isNode = fs.existsSync(path.join(options.templatePath, 'package.json'));
   // if (isNode) {
   //    shell.cd(options.tartgetPath);
   //    const result = shell.exec('npm install');
   //    if (result.code !== 0) {
   //       return false;
   //    }
   // }

   // return true;
}

