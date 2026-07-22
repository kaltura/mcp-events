#### General description
Functional tests of the MCP Kaltura Events server  


#### Tools and Languages
- [Node.js](https://nodejs.org/en/) - JavaScript runtime environment  
- Typescript as the programming language  
- Node.js Test Runner (Node.js Test Runner) for executing tests  

#### Code Conventions
Use code conventions of TypeScript   
Any function/method should not have more than 3 parameters. If more than 3 parameters are needed, consider using an object/type to encapsulate the parameters.  
Always add types and documentation for functions, methods, and classes. Use JSDoc or TSDoc style comments.  
For every imported code investigate possible exceptions and handle them properly  
After any code change it should be checked by linting (command: `npm run lint`)  
Any duplicated code should be refactored to a helper function or class. Avoid code duplication.  


#### Test Structure
Each test file should be named with the pattern `*.test.ts`  
The structure of a tests should be with the accordance to the AAA principle (Arrange, Act, Assert). Each test should have a clear separation of these three phases.
Test body should not have any conditions

