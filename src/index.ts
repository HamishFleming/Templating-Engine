#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import * as inquirer from 'inquirer';

// import chalk from 'chalk';

const CHOICES = fs.readdirSync(path.join(__dirname, 'templates'));
const QUESTIONS = [
  {
    name: 'template',
    type: 'list',
    message: 'What project template would you like to use?',
    choices: CHOICES,
  },
  {
    name: 'name',
    type: 'input',
    message: 'New project name?',
  },
];

inquirer.prompt(QUESTIONS).then((answers: any) => {
  console.log(answers);
});
