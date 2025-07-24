#!/bin/bash

# Teams Assignment Test Runner
# Script để chạy các test cases cho trang quản lý chia đội

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if application is running
check_app_running() {
    print_status "Checking if application is running..."
    
    if curl -s http://localhost:3000 > /dev/null; then
        print_success "Application is running on http://localhost:3000"
        return 0
    else
        print_error "Application is not running on http://localhost:3000"
        print_status "Please start the application with: npm run dev"
        return 1
    fi
}

# Function to install dependencies
install_deps() {
    print_status "Installing test dependencies..."
    
    if [ -f "package.json" ]; then
        npm install
        npx playwright install
        print_success "Dependencies installed successfully"
    else
        print_error "package.json not found in tests directory"
        return 1
    fi
}

# Function to create reports directory
setup_reports() {
    print_status "Setting up reports directory..."
    
    mkdir -p reports/{html,screenshots,videos,traces}
    print_success "Reports directory created"
}

# Function to run specific test category
run_test_category() {
    local category=$1
    local description=$2
    
    print_status "Running $description..."
    
    case $category in
        "auth")
            npx playwright test --config=config/playwright.config.ts e2e/authentication/
            ;;
        "ui")
            npx playwright test --config=config/playwright.config.ts e2e/ui-components/
            ;;
        "teams")
            npx playwright test --config=config/playwright.config.ts e2e/teams-assignment/
            ;;
        "api")
            npx playwright test --config=config/playwright.config.ts integration/api-endpoints/
            ;;
        "all")
            npx playwright test --config=config/playwright.config.ts
            ;;
        *)
            print_error "Unknown test category: $category"
            return 1
            ;;
    esac
    
    if [ $? -eq 0 ]; then
        print_success "$description completed successfully"
    else
        print_error "$description failed"
        return 1
    fi
}

# Function to show help
show_help() {
    echo "Teams Assignment Test Runner"
    echo ""
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  -h, --help          Show this help message"
    echo "  -i, --install       Install dependencies only"
    echo "  -c, --check         Check if application is running"
    echo "  -a, --auth          Run authentication tests only"
    echo "  -u, --ui            Run UI/UX tests only"
    echo "  -t, --teams         Run teams assignment tests only"
    echo "  -p, --api           Run API integration tests only"
    echo "  -A, --all           Run all tests (default)"
    echo "  -r, --report        Show test report"
    echo "  -d, --debug         Run tests in debug mode"
    echo "  -H, --headed        Run tests in headed mode"
    echo "  --chrome            Run tests on Chrome only"
    echo "  --firefox           Run tests on Firefox only"
    echo "  --mobile            Run tests on mobile only"
    echo ""
    echo "Examples:"
    echo "  $0                  # Run all tests"
    echo "  $0 --auth           # Run authentication tests only"
    echo "  $0 --ui --chrome    # Run UI tests on Chrome only"
    echo "  $0 --debug          # Run all tests in debug mode"
}

# Main execution
main() {
    local test_category="all"
    local browser=""
    local mode=""
    local install_only=false
    local check_only=false
    local show_report=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -i|--install)
                install_only=true
                shift
                ;;
            -c|--check)
                check_only=true
                shift
                ;;
            -a|--auth)
                test_category="auth"
                shift
                ;;
            -u|--ui)
                test_category="ui"
                shift
                ;;
            -t|--teams)
                test_category="teams"
                shift
                ;;
            -p|--api)
                test_category="api"
                shift
                ;;
            -A|--all)
                test_category="all"
                shift
                ;;
            -r|--report)
                show_report=true
                shift
                ;;
            -d|--debug)
                mode="--debug"
                shift
                ;;
            -H|--headed)
                mode="--headed"
                shift
                ;;
            --chrome)
                browser="--project=chromium"
                shift
                ;;
            --firefox)
                browser="--project=firefox"
                shift
                ;;
            --mobile)
                browser="--project=\"Mobile Chrome\""
                shift
                ;;
            *)
                print_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Change to tests directory
    cd "$(dirname "$0")"
    
    print_status "Teams Assignment Test Runner"
    print_status "=============================="
    
    # Install dependencies if requested
    if [ "$install_only" = true ]; then
        install_deps
        exit 0
    fi
    
    # Check application if requested
    if [ "$check_only" = true ]; then
        check_app_running
        exit $?
    fi
    
    # Show report if requested
    if [ "$show_report" = true ]; then
        print_status "Opening test report..."
        npx playwright show-report reports/html
        exit 0
    fi
    
    # Setup environment
    setup_reports
    
    # Check if application is running
    if ! check_app_running; then
        exit 1
    fi
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        install_deps
    fi
    
    # Run tests
    print_status "Starting test execution..."
    
    local test_command="npx playwright test --config=config/playwright.config.ts"
    
    # Add browser selection
    if [ -n "$browser" ]; then
        test_command="$test_command $browser"
    fi
    
    # Add mode
    if [ -n "$mode" ]; then
        test_command="$test_command $mode"
    fi
    
    # Add test category
    case $test_category in
        "auth")
            test_command="$test_command e2e/authentication/"
            ;;
        "ui")
            test_command="$test_command e2e/ui-components/"
            ;;
        "teams")
            test_command="$test_command e2e/teams-assignment/"
            ;;
        "api")
            test_command="$test_command integration/api-endpoints/"
            ;;
    esac
    
    print_status "Executing: $test_command"
    eval $test_command
    
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        print_success "All tests completed successfully!"
        print_status "View detailed report: npx playwright show-report reports/html"
    else
        print_error "Some tests failed. Check the report for details."
        print_status "View detailed report: npx playwright show-report reports/html"
    fi
    
    exit $exit_code
}

# Run main function with all arguments
main "$@"
