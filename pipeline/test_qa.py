import unittest
import bashlex
from pydantic import ValidationError
from schemas import BuildStep 

class TestAIValidationEngine(unittest.TestCase):
    
    def test_schema_validation(self):
        """Tests that Pydantic rejects malformed LLM JSON outputs."""
        with self.assertRaises(ValidationError):
            # Fails because step_number expects an integer, and command is missing
            BuildStep(step_number="one", phase="Dependencies")
            
        # Valid schema setup passes
        valid_step = BuildStep(step_number=1, phase="Setup", command="sudo yum install git")
        self.assertEqual(valid_step.step_number, 1)

    def test_ast_parser_posix(self):
        """Tests AST parser on standard POSIX shell script snippets."""
        posix_bash = 'if [ "$DISTRO" = "ubuntu" ]; then apt-get install -y wget; fi'
        trees = bashlex.parse(posix_bash)
        self.assertTrue(len(trees) > 0)

    def test_ast_parser_bash_limitation(self):
        """Documents that bashlex fails on advanced Bash 4.0+ syntax like [[ ]]"""
        complex_bash = 'if [[ "$DISTRO" == "ubuntu" ]]; then apt-get install -y wget; fi'
        with self.assertRaises(Exception):
            bashlex.parse(complex_bash)

if __name__ == '__main__':
    unittest.main()
